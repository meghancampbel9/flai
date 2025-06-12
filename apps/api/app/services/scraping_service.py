import asyncio
import logging
import re
from typing import List, Dict, Any, Optional
from firecrawl import AsyncFirecrawlApp, ScrapeOptions
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.dialects.postgresql import insert
import aiohttp
import base64

from app.config.settings import settings
from app.models.product import Product
from app.schemas.product import ProductCreate
from app.config.database import get_db
from app.services.embedding_service import embedding_service

from fastapi import Depends

logger = logging.getLogger(__name__)

class ScrapingService:
    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session
        self.firecrawl = AsyncFirecrawlApp(api_key=settings.FIRECRAWL_API_KEY)

    async def scrape_and_save_products(self, urls: List[str], limit_per_url: int):
        all_products_to_save = []
        for url in urls:
            product_urls = await self._extract_product_urls(url, limit=limit_per_url)
            if not product_urls:
                logger.info(f"No product URLs found for category: {url}")
                continue
            
            logger.info(f"Starting to process {len(product_urls)} products for category: {url}")
            for i, product_url in enumerate(product_urls):
                logger.info(f"--> Processing product {i+1}/{len(product_urls)}: {product_url}")
                
                gender_tag = "unisex"
                if "/women-" in product_url.lower():
                    gender_tag = "women"
                elif "/men-" in product_url.lower():
                    gender_tag = "men"

                details = await self._extract_product_details(product_url)
                if details and 'name' in details and 'image_url' in details:
                    product_data = ProductCreate(
                        name=details.get("name"),
                        brand=details.get("brand"),
                        price=details.get("price"),
                        currency=details.get("currency"),
                        description=details.get("description"),
                        sizes=details.get("sizes"),
                        colors=details.get("colors"),
                        material=details.get("material"),
                        product_url=product_url,
                        image_url=details.get("image_url"),
                        gender_tag=gender_tag,
                        source="vestiaire_collective"
                    )
                    all_products_to_save.append(product_data)
        
        await self._save_products_to_db(all_products_to_save)
        logger.info(f"Scraping job completed. Processed {len(all_products_to_save)} products.")

    async def _extract_product_urls(self, page_url: str, limit: int) -> List[str]:
        logger.info(f"Crawling {page_url} to find product URLs.")
        try:
            crawl_result = await self.firecrawl.crawl_url(
                url=page_url,
                limit= 5,
                scrape_options=ScrapeOptions(
                    onlyMainContent=False,
                    formats=['markdown']
                )
            )
            
            product_urls = []
            if not crawl_result or not crawl_result.data:
                return []

            for page_data in crawl_result.data:
                if not page_data.markdown:
                    continue
                
                markdown_content = page_data.markdown
                
                found_urls = re.findall(
                    r'https://us\.vestiairecollective\.com/(?:women|men)-[^/]+(?:/[^/]+)+\.shtml',
                    markdown_content
                )
                product_urls.extend(found_urls)

            unique_urls = list(dict.fromkeys(product_urls))
            logger.info(f"Found {len(unique_urls)} unique product URLs from {page_url}")
            return unique_urls[:limit]

        except Exception as e:
            logger.error(f"Error crawling {page_url}: {e}")
            return []

    async def _extract_product_details(self, product_url: str) -> Dict[str, Any]:
        logger.info(f"Scraping product details from {product_url}")
        schema = {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "brand": {"type": "string"},
                "price": {"type": "number"},
                "currency": {"type": "string"},
                "description": {"type": "string"},
                "sizes": {"type": "array", "items": {"type": "string"}},
                "colors": {"type": "array", "items": {"type": "string"}},
                "material": {"type": "string"},
                "image_url": {"type": "string", "description": "The primary product image URL, often found in 'og:image' meta tag."},
            },
            "required": ["name", "price", "currency", "description", "image_url"]
        }
        try:
            logger.info(f"-> Extracting structured data from {product_url}")
            extracted_result = await self.firecrawl.extract(
                urls=[product_url],
                prompt="Extract product details from this page, including the main product image URL (often from the og:image meta tag), name, brand, price, currency, description, available sizes, colors, and material.",
                schema=schema,
            )

            if not extracted_result or not extracted_result.data:
                logger.warning(f"No data extracted from {product_url}")
                return {}

            details = extracted_result.data
            
            if isinstance(details, dict):
                return details

            logger.warning(f"Extracted data from {product_url} is not a dictionary.")
            return {}
        except Exception as e:
            logger.error(f"Error extracting details from {product_url}: {e}")
            return {}

    async def _download_image_b64_with_browser(self, image_url: str) -> Optional[str]:
        """
        Uses a headless browser via firecrawl.scrape_url to take a screenshot,
        then downloads the resulting image from its temporary URL.
        """
        try:
            logger.info(f"Requesting screenshot for URL: {image_url}")
            
            # 1. Request a screenshot
            scrape_result = await self.firecrawl.scrape_url(
                url=image_url,
                actions=[{'type': 'screenshot'}]
            )

            logger.info(f"scrape_result: {scrape_result}")
            
            # 2. Extract the temporary screenshot URL from the response object.
            if not (
                scrape_result
                and hasattr(scrape_result, 'actions')
                and scrape_result.actions
                and hasattr(scrape_result.actions, 'screenshots')
                and scrape_result.actions.screenshots
            ):
                logger.warning(f"Firecrawl did not return a screenshot URL for {image_url}. Result: {scrape_result}")
                return None

            screenshot_url = scrape_result.actions.screenshots[0]
            logger.info(f"Screenshot URL received: {screenshot_url}. Downloading final image...")

            # 3. Download the image from the temporary screenshot URL.
            async with aiohttp.ClientSession() as session:
                async with session.get(screenshot_url, timeout=30) as response:
                    if response.status != 200:
                        logger.warning(f"Failed to download screenshot from {screenshot_url}: {response.status}")
                        return None
                    image_data = await response.read()
                    logger.info("✅ Successfully downloaded screenshot image.")
                    
                    # 4. Return the image data as base64.
                    return base64.b64encode(image_data).decode('utf-8')

        except Exception as e:
            logger.error(f"❌ Firecrawl screenshot process failed for {image_url}: {e}", exc_info=True)
            return None

    async def _save_products_to_db(self, products_data: List[ProductCreate]):
        if not products_data:
            return

        logger.info(f"Starting to generate image embeddings for {len(products_data)} products...")
        products_to_insert = []
        for p_data in products_data:
            if not p_data.image_url:
                logger.warning(f"Product '{p_data.name}' has no image_url, skipping embedding.")
                continue

            logger.info(f"-> Downloading image for embedding: {p_data.image_url}")
            image_b64 = await self._download_image_b64_with_browser(str(p_data.image_url))
            if not image_b64:
                logger.warning(f"Could not download image for product: {p_data.name}. Skipping.")
                continue

            embedding = await embedding_service.generate_image_embedding(image_b64=image_b64)
            if not embedding:
                logger.warning(f"Could not generate embedding for product: {p_data.name}. Skipping.")
                continue
            
            product_dict = p_data.dict()
            product_dict['embedding'] = embedding
            products_to_insert.append(product_dict)

        if not products_to_insert:
            logger.info("No new products with embeddings to save.")
            return

        logger.info(f"Saving or updating {len(products_to_insert)} products in the database...")
        stmt = insert(Product).values(products_to_insert)
        stmt = stmt.on_conflict_do_update(
            index_elements=['product_url'],
            set_={
                'name': stmt.excluded.name,
                'brand': stmt.excluded.brand,
                'price': stmt.excluded.price,
                'original_price': stmt.excluded.original_price,
                'currency': stmt.excluded.currency,
                'image_url': stmt.excluded.image_url,
                'category': stmt.excluded.category,
                'is_on_sale': stmt.excluded.is_on_sale,
                'description': stmt.excluded.description,
                'sizes': stmt.excluded.sizes,
                'colors': stmt.excluded.colors,
                'material': stmt.excluded.material,
                'gender_tag': stmt.excluded.gender_tag,
                'source': stmt.excluded.source,
                'embedding': stmt.excluded.embedding,
            }
        )
        await self.db_session.execute(stmt)
        await self.db_session.commit()
        logger.info(f"Successfully saved or updated {len(products_to_insert)} products.")


async def get_scraping_service(db: AsyncSession = Depends(get_db)) -> ScrapingService:
    return ScrapingService(db) 
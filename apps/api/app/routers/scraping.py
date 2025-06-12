from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from typing import List

from app.schemas.product import ScrapeRequest
from app.services.scraping_service import ScrapingService, get_scraping_service

router = APIRouter()

@router.post("/scrape-products", status_code=202)
async def scrape_products(
    request: ScrapeRequest,
    background_tasks: BackgroundTasks,
    scraping_service: ScrapingService = Depends(get_scraping_service),
):
    """
    Initiates a background task to scrape products from a list of URLs.
    """
    if not request.urls:
        raise HTTPException(status_code=400, detail="No URLs provided for scraping.")

    background_tasks.add_task(
        scraping_service.scrape_and_save_products,
        urls=request.urls,
        limit_per_url=request.limit_per_url
    )

    return {"message": f"Scraping job started in the background for {len(request.urls)} URLs."} 
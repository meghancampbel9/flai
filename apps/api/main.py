from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import logging
import asyncio
from contextlib import asynccontextmanager
from app.routers.pinterest_gemini import router as pinterest_router
from app.routers.users import router as users_router
from app.routers.scraping import router as scraping_router
from app.routers.products import router as products_router
from app.routers import shop

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Filter out harmless CancelledError from uvicorn lifespan
class CancelledErrorFilter(logging.Filter):
    def filter(self, record):
        return not (record.exc_info and 
                   record.exc_info[0] and 
                   issubclass(record.exc_info[0], asyncio.CancelledError))

# Apply filter to relevant loggers
logging.getLogger("uvicorn.error").addFilter(CancelledErrorFilter())
logging.getLogger("starlette").addFilter(CancelledErrorFilter())

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        # Check required environment variables
        required_env_vars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
        missing_vars = [var for var in required_env_vars if not os.getenv(var)]
        
        if missing_vars:
            logger.warning(f"⚠️ Missing environment variables: {missing_vars} - API will run in limited mode")
        else:
            logger.info("✅ Environment variables configured")
            
            # Try to test database connection (non-blocking)
            try:
                from app.config.database import db_config
                async with db_config.SessionLocal() as session:
                    from sqlalchemy import text
                    result = await session.execute(text("SELECT 1"))
                    logger.info("✅ Database connection successful")
            except Exception as e:
                logger.warning(f"⚠️ Database connection failed: {e}")
                logger.info("ℹ️ API will continue running with limited functionality")
        
        logger.info("🚀 API initialized successfully")
        
    except Exception as e:
        logger.warning(f"⚠️ Startup warning: {e}")
        logger.info("ℹ️ API will continue running with limited functionality")

    yield

    # Shutdown
    try:
        logger.info("🛑 Shutting down API...")
        try:
            from app.config.database import db_config
            await db_config.engine.dispose()
            logger.info("✅ Database connections closed")
        except Exception as e:
            logger.warning(f"⚠️ Database cleanup warning: {e}")
    except Exception as e:
        logger.warning(f"Warning during shutdown: {e}")

# Create FastAPI app
app = FastAPI(
    title="Flai Ecommerce API",
    description="AI-powered ecommerce platform backend with SQLAlchemy + Supabase",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS (Cross-Origin Resource Sharing) for web future use 
allowed_origins = []

# Development origins
if os.getenv("DEBUG", "").lower() == "true" or os.getenv("ENVIRONMENT") == "development":
    allowed_origins.extend([
        "http://localhost:8081",      # Expo dev server
        "http://localhost:19006",     # Expo web
        "http://localhost:3000",      # React dev server (for web later)
        "http://127.0.0.1:8081",
        "http://127.0.0.1:19006",
        "http://127.0.0.1:3000",
        "exp://192.168.1.100:8081",   # Expo on local network
    ])

# Production origins  
if os.getenv("ENVIRONMENT") == "production":
    production_domains = os.getenv("ALLOWED_ORIGINS", "").split(",")
    allowed_origins.extend([domain.strip() for domain in production_domains if domain.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=[
        "Accept",
        "Accept-Language", 
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
    ],
)

@app.get("/")
async def root():
    return {
        "message": "Welcome to Flai Ecommerce API", 
        "status": "running",
        "version": "2.0.0",
        "database": "SQLAlchemy + Supabase"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint with database connectivity test"""
    try:
        from app.config.database import db_config
        async with db_config.SessionLocal() as session:
            from sqlalchemy import text
            await session.execute(text("SELECT 1"))
        
        return {
            "status": "healthy", 
            "version": "2.0.0",
            "database": "connected",
            "service": "SQLAlchemy + Supabase"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "version": "2.0.0", 
            "database": "disconnected",
            "error": str(e)
        }

app.include_router(pinterest_router, prefix="/api/v1/pinterest", tags=["Pinterest & AI Analysis"])
app.include_router(users_router, prefix="/api/v1/users", tags=["Users & Profiles"])
app.include_router(scraping_router, prefix="/api/v1/scraping", tags=["Web Scraping"])
app.include_router(products_router, prefix="/api/v1/products", tags=["Products"])
app.include_router(shop.router, prefix="/api/v1/shop", tags=["Shop"])

logger.info("✅ Routers loaded successfully")
logger.info("🚀 Flai API v2.0.0 wih SQLAlchemy + Supabase ready!")

if __name__ == "__main__":
    try:
        port = int(os.getenv("PORT", 8000))
        
        logger.info("🚀 Starting Flai API server...")
        logger.info(f"🌐 Server will start on port {port}")
        logger.info("📚 API Documentation will be available at:")
        logger.info(f"   - Swagger UI: http://localhost:{port}/docs")
        logger.info(f"   - ReDoc: http://localhost:{port}/redoc")
        logger.info(f"   - Health Check: http://localhost:{port}/health")
        
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=port,
            reload=True
        )
        
    except KeyboardInterrupt:
        logger.info("🛑 Server stopped by user")
    except Exception as e:
        logger.error(f"❌ Failed to start server: {e}")
        logger.error("💡 Try checking your environment variables and database connection")
        raise 
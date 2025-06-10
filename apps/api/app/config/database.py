import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool
from sqlalchemy import text
import logging

logger = logging.getLogger(__name__)

# Database configuration
class DatabaseConfig:
    def __init__(self):
        # Validate required environment variables
        supabase_url = os.getenv('SUPABASE_URL', '')
        supabase_service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '')
        
        if not supabase_url:
            raise ValueError("SUPABASE_URL environment variable is required")
        if not supabase_service_key:
            raise ValueError("SUPABASE_SERVICE_ROLE_KEY environment variable is required")
        
        # Use the pooler host which has IPv4 connectivity
        db_host = os.getenv('SUPABASE_DB_HOST', 'aws-0-eu-central-1.pooler.supabase.com')
        db_port = os.getenv('SUPABASE_DB_PORT', '5432')
        db_user = os.getenv('SUPABASE_DB_USER', 'postgres')
        db_password = os.getenv('SUPABASE_DB_PASSWORD', supabase_service_key)
        db_name = os.getenv('SUPABASE_DB_NAME', 'postgres')
        
        # Build async PostgreSQL connection string using pooler
        self.database_url = f"postgresql+asyncpg://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
        
        # Create async engine
        self.engine = create_async_engine(
            self.database_url,
            echo=False,
            poolclass=NullPool,  # NullPool for Supabase connections
            pool_recycle=3600,  # Recycle connections every hour
            connect_args={
                "server_settings": {
                    "application_name": "flai_api",
                },
                "command_timeout": 60,  # Query timeout
            }
        )
        
        # Create session factory
        self.SessionLocal = async_sessionmaker(
            bind=self.engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
        
        logger.info(f"Database configured with pooler host: {db_host}")
    
    async def health_check(self) -> bool:
        """Check database connectivity for health endpoints"""
        try:
            async with self.SessionLocal() as session:
                await session.execute(text("SELECT 1"))
                return True
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False

# Global database instance
db_config = DatabaseConfig()

# Dependency to get database session
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with db_config.SessionLocal() as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"Database session error: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()

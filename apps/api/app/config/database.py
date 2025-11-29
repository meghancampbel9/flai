import os
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool
from sqlalchemy import text
import logging

from .settings import settings

logger = logging.getLogger(__name__)

# Database configuration
class DatabaseConfig:
    def __init__(self):
        # Use the DATABASE_URL directly, converting to async format
        database_url = settings.DATABASE_URL
        if database_url.startswith('postgresql://'):
            # Convert postgresql:// to postgresql+asyncpg:// for async support
            database_url = database_url.replace('postgresql://', 'postgresql+asyncpg://', 1)
        
        self.database_url = database_url
        
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
        
        logger.info(f"Database configured with URL: {database_url.split('@')[1] if '@' in database_url else 'configured'}")
    
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

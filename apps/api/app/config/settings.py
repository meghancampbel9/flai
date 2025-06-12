import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    SUPABASE_DB_HOST: str = os.getenv("SUPABASE_DB_HOST", "aws-0-eu-central-1.pooler.supabase.com")
    SUPABASE_DB_PORT: str = os.getenv("SUPABASE_DB_PORT", "5432")
    SUPABASE_DB_USER: str = os.getenv("SUPABASE_DB_USER", "postgres")
    SUPABASE_DB_PASSWORD: str = os.getenv("SUPABASE_DB_PASSWORD", SUPABASE_SERVICE_ROLE_KEY)
    SUPABASE_DB_NAME: str = os.getenv("SUPABASE_DB_NAME", "postgres")

    # Google AI
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    
    # Firecrawl
    FIRECRAWL_API_KEY: str = os.getenv("FIRECRAWL_API_KEY", "")

    def __post_init__(self):
        # Validate required environment variables
        if not self.SUPABASE_URL:
            raise ValueError("SUPABASE_URL environment variable is required")
        if not self.SUPABASE_SERVICE_ROLE_KEY:
            raise ValueError("SUPABASE_SERVICE_ROLE_KEY environment variable is required")
        if not self.FIRECRAWL_API_KEY:
            raise ValueError("FIRECRAWL_API_KEY environment variable is required")

settings = Settings()
settings.__post_init__() 
#!/usr/bin/env python3
"""
Script to fix missing auth.users entries for existing user_profiles
"""

import asyncio
import asyncpg
import os
import uuid
from datetime import datetime
import random
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv('/home/meg/dev/flai/.env')

# Database connection settings
DATABASE_URL = os.getenv("DATABASE_URL", "")

# URL-encode the password if it contains special characters
if DATABASE_URL and "KB4+uhr9a?GD9FK" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("KB4+uhr9a?GD9FK", "KB4%2Buhr9a%3FGD9FK")

async def fix_auth_users():
    """Add missing auth.users entries for existing user_profiles"""
    
    if not DATABASE_URL:
        print("❌ DATABASE_URL environment variable is not set")
        return
    
    try:
        # Connect to database
        conn = await asyncpg.connect(DATABASE_URL)
        print("✅ Connected to database")
        
        # Get all user_profiles that don't have corresponding auth.users entries
        missing_auth_users = await conn.fetch("""
            SELECT up.user_id, up.username 
            FROM user_profiles up 
            LEFT JOIN auth.users au ON up.user_id::text = au.id::text 
            WHERE au.id IS NULL
        """)
        
        print(f"Found {len(missing_auth_users)} users missing from auth.users")
        
        for i, user in enumerate(missing_auth_users):
            user_id = user['user_id']
            username = user['username']
            
            # Insert into auth.users with unique email
            await conn.execute("""
                INSERT INTO auth.users (
                    id, email, phone, created_at, updated_at, 
                    email_confirmed_at, phone_confirmed_at, aud, role
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            """, 
                str(user_id),
                f"{username}+{i}@example.com",
                f"+1555{random.randint(1000000, 9999999)}",
                datetime.now(),
                datetime.now(),
                datetime.now(),
                datetime.now(),
                "authenticated",
                "authenticated"
            )
            print(f"Added {username} to auth.users")
        
        await conn.close()
        print("✅ Done!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(fix_auth_users())

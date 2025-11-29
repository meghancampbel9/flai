#!/usr/bin/env python3
"""
Script to set up following relationships for existing users
"""

import asyncio
import asyncpg
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv('/home/meg/dev/flai/.env')

# Database connection settings
DATABASE_URL = os.getenv("DATABASE_URL", "")

# URL-encode the password if it contains special characters
if DATABASE_URL and "KB4+uhr9a?GD9FK" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("KB4+uhr9a?GD9FK", "KB4%2Buhr9a%3FGD9FK")

async def setup_following():
    """Set up following relationships"""
    
    if not DATABASE_URL:
        print("❌ DATABASE_URL environment variable is not set")
        return
    
    try:
        # Connect to database
        conn = await asyncpg.connect(DATABASE_URL)
        print("✅ Connected to database")
        
        # Get meg123 user ID
        meg123_check = await conn.fetchrow("SELECT user_id FROM user_profiles WHERE username = 'meg123'")
        if not meg123_check:
            print("❌ User 'meg123' not found")
            return
        
        meg123_id = meg123_check['user_id']
        print(f"✅ Found meg123 (ID: {meg123_id})")
        
        # Get all test users (excluding meg123)
        test_users = await conn.fetch("""
            SELECT user_id FROM user_profiles 
            WHERE username IN (
                'alex_fashion', 'sarah_style', 'mike_trends', 'emma_chic', 'james_casual',
                'lisa_elegant', 'david_street', 'anna_vintage', 'tom_classic', 'sophie_modern',
                'chris_sporty', 'maya_bohemian', 'ryan_minimal', 'zoe_colorful', 'ben_formal',
                'luna_artistic', 'max_urban', 'nina_romantic', 'leo_edgy', 'iris_sustainable',
                'felix_preppy', 'ruby_glamorous', 'oscar_retro', 'lily_eclectic'
            )
        """)
        
        print(f"✅ Found {len(test_users)} test users")
        
        # Set up following relationships
        print("\n🔗 Setting up following relationships...")
        
        # 15 users follow meg123
        followers_of_meg123 = test_users[:15]
        print(f"\n📌 Making {len(followers_of_meg123)} users follow meg123...")
        
        for i, user in enumerate(followers_of_meg123, 1):
            follower_id = user['user_id']
            await conn.execute("""
                INSERT INTO user_follows (follower_id, following_id, created_at)
                VALUES ($1, $2, $3)
                ON CONFLICT (follower_id, following_id) DO NOTHING
            """, follower_id, meg123_id, datetime.now())
            
            username = await conn.fetchval("SELECT username FROM user_profiles WHERE user_id = $1", follower_id)
            print(f"  {i:2d}. {username} now follows meg123")
        
        # meg123 follows 21 users
        users_followed_by_meg123 = test_users[:21]
        print(f"\n📌 Making meg123 follow {len(users_followed_by_meg123)} users...")
        
        for i, user in enumerate(users_followed_by_meg123, 1):
            following_id = user['user_id']
            await conn.execute("""
                INSERT INTO user_follows (follower_id, following_id, created_at)
                VALUES ($1, $2, $3)
                ON CONFLICT (follower_id, following_id) DO NOTHING
            """, meg123_id, following_id, datetime.now())
            
            username = await conn.fetchval("SELECT username FROM user_profiles WHERE user_id = $1", following_id)
            print(f"  {i:2d}. meg123 now follows {username}")
        
        # Verify the counts
        print("\n📊 Verifying follower counts...")
        
        meg123_followers = await conn.fetchval("SELECT COUNT(*) FROM user_follows WHERE following_id = $1", meg123_id)
        meg123_following = await conn.fetchval("SELECT COUNT(*) FROM user_follows WHERE follower_id = $1", meg123_id)
        
        print(f"✅ meg123 now has {meg123_followers} followers")
        print(f"✅ meg123 now follows {meg123_following} users")
        
        # Update follower/following counts in user_profiles
        await conn.execute("""
            UPDATE user_profiles 
            SET followers_count = (
                SELECT COUNT(*) FROM user_follows 
                WHERE following_id = user_profiles.user_id
            ),
            following_count = (
                SELECT COUNT(*) FROM user_follows 
                WHERE follower_id = user_profiles.user_id
            )
            WHERE username = 'meg123'
        """)
        
        print("\n🎉 Script completed successfully!")
        print(f"👥 Set up {len(followers_of_meg123)} users following meg123")
        print(f"👥 Set up meg123 following {len(users_followed_by_meg123)} users")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        if 'conn' in locals():
            await conn.close()
            print("🔌 Database connection closed")

if __name__ == "__main__":
    print("🚀 Starting following relationships setup...")
    print("=" * 60)
    asyncio.run(setup_following())
    print("=" * 60)
    print("✨ Script finished!")

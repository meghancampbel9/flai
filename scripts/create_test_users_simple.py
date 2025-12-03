#!/usr/bin/env python3
"""
Script to automatically add 24 new users and set up following relationships:
- 15 users will follow meg123
- meg123 will follow 21 users

This script assumes meg123 and meg123 already exist in the database.
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

# Sample usernames and display names
SAMPLE_USERS = [
    {"username": "alex_fashion", "display_name": "Alex Fashion", "bio": "Fashion enthusiast and style blogger"},
    {"username": "sarah_style", "display_name": "Sarah Style", "bio": "Personal stylist and fashion consultant"},
    {"username": "mike_trends", "display_name": "Mike Trends", "bio": "Following the latest fashion trends"},
    {"username": "emma_chic", "display_name": "Emma Chic", "bio": "Minimalist fashion lover"},
    {"username": "james_casual", "display_name": "James Casual", "bio": "Casual wear specialist"},
    {"username": "lisa_elegant", "display_name": "Lisa Elegant", "bio": "Elegant fashion and lifestyle"},
    {"username": "david_street", "display_name": "David Street", "bio": "Street style photographer"},
    {"username": "anna_vintage", "display_name": "Anna Vintage", "bio": "Vintage fashion collector"},
    {"username": "tom_classic", "display_name": "Tom Classic", "bio": "Classic menswear enthusiast"},
    {"username": "sophie_modern", "display_name": "Sophie Modern", "bio": "Modern fashion trends"},
    {"username": "chris_sporty", "display_name": "Chris Sporty", "bio": "Athletic wear and sports fashion"},
    {"username": "maya_bohemian", "display_name": "Maya Bohemian", "bio": "Bohemian style lover"},
    {"username": "ryan_minimal", "display_name": "Ryan Minimal", "bio": "Minimalist fashion approach"},
    {"username": "zoe_colorful", "display_name": "Zoe Colorful", "bio": "Colorful and vibrant fashion"},
    {"username": "ben_formal", "display_name": "Ben Formal", "bio": "Formal wear specialist"},
    {"username": "luna_artistic", "display_name": "Luna Artistic", "bio": "Artistic fashion expression"},
    {"username": "max_urban", "display_name": "Max Urban", "bio": "Urban fashion trends"},
    {"username": "nina_romantic", "display_name": "Nina Romantic", "bio": "Romantic and feminine style"},
    {"username": "leo_edgy", "display_name": "Leo Edgy", "bio": "Edgy and alternative fashion"},
    {"username": "iris_sustainable", "display_name": "Iris Sustainable", "bio": "Sustainable fashion advocate"},
    {"username": "felix_preppy", "display_name": "Felix Preppy", "bio": "Preppy style enthusiast"},
    {"username": "ruby_glamorous", "display_name": "Ruby Glamorous", "bio": "Glamorous fashion and beauty"},
    {"username": "oscar_retro", "display_name": "Oscar Retro", "bio": "Retro fashion lover"},
    {"username": "lily_eclectic", "display_name": "Lily Eclectic", "bio": "Eclectic and unique style"},
]

async def create_users_and_follows():
    """Create users and set up following relationships"""
    
    if not DATABASE_URL:
        print("❌ DATABASE_URL environment variable is not set")
        print("Please set it to your Supabase database URL")
        return
    
    try:
        # Connect to database
        conn = await asyncpg.connect(DATABASE_URL)
        print("✅ Connected to database")
        
        # First, check if meg123 exists
        meg123_check = await conn.fetchrow("SELECT user_id FROM user_profiles WHERE username = 'meg123'")
        
        if not meg123_check:
            print("❌ User 'meg123' not found. Please create this user first.")
            print("You can create it through the mobile app or Supabase dashboard.")
            return
        
        meg123_id = meg123_check['user_id']
        
        print(f"✅ Found meg123 (ID: {meg123_id})")
        
        # Get existing users or create new ones
        created_user_ids = []
        
        print("\n📝 Getting existing users or creating new ones...")
        
        for i, user_data in enumerate(SAMPLE_USERS, 1):
            # Check if user already exists
            existing_user = await conn.fetchrow("SELECT user_id FROM user_profiles WHERE username = $1", user_data['username'])
            
            if existing_user:
                user_id = existing_user['user_id']
                print(f"  {i:2d}. Found existing user: {user_data['username']} ({user_data['display_name']})")
            else:
                user_id = uuid.uuid4()
                
                # Insert into auth.users first
                await conn.execute("""
                    INSERT INTO auth.users (
                        id,
                        email,
                        phone,
                        created_at,
                        updated_at,
                        email_confirmed_at,
                        phone_confirmed_at,
                        aud,
                        role
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    ON CONFLICT (id) DO NOTHING
                """,
                    str(user_id),
                    f"{user_data['username']}@example.com",
                    f"+1555{random.randint(1000000, 9999999)}",
                    datetime.now(),
                    datetime.now(),
                    datetime.now(),
                    datetime.now(),
                    "authenticated",
                    "authenticated"
                )
                
                # Insert into user_profiles
                await conn.execute("""
                    INSERT INTO user_profiles (
                        id,
                        user_id,
                        username,
                        display_name,
                        bio,
                        onboarding_completed,
                        created_at,
                        updated_at,
                        followers_count,
                        following_count
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    ON CONFLICT (username) DO NOTHING
                """,
                    str(user_id),
                    str(user_id),
                    user_data['username'],
                    user_data['display_name'],
                    user_data['bio'],
                    True,
                    datetime.now(),
                    datetime.now(),
                    0,
                    0
                )
                print(f"  {i:2d}. Created new user: {user_data['username']} ({user_data['display_name']})")
            
            created_user_ids.append(user_id)
        
        print(f"\n✅ Successfully processed {len(created_user_ids)} users")
        
        # Set up following relationships
        print("\n🔗 Setting up following relationships...")
        
        # 15 users follow meg123
        followers_of_meg123 = created_user_ids[:15]
        print(f"\n📌 Making {len(followers_of_meg123)} users follow meg123...")
        
        for i, follower_id in enumerate(followers_of_meg123, 1):
            await conn.execute("""
                INSERT INTO user_follows (follower_id, following_id, created_at)
                VALUES ($1::uuid, $2::uuid, $3)
                ON CONFLICT (follower_id, following_id) DO NOTHING
            """, str(follower_id), str(meg123_id), datetime.now())
            
            username = await conn.fetchval("SELECT username FROM user_profiles WHERE user_id = $1::uuid", str(follower_id))
            print(f"  {i:2d}. {username} now follows meg123")
        
        # meg123 follows 21 users
        users_followed_by_meg123 = created_user_ids[:21]
        print(f"\n📌 Making meg123 follow {len(users_followed_by_meg123)} users...")
        
        for i, following_id in enumerate(users_followed_by_meg123, 1):
            await conn.execute("""
                INSERT INTO user_follows (follower_id, following_id, created_at)
                VALUES ($1::uuid, $2::uuid, $3)
                ON CONFLICT (follower_id, following_id) DO NOTHING
            """, str(meg123_id), str(following_id), datetime.now())
            
            username = await conn.fetchval("SELECT username FROM user_profiles WHERE user_id = $1::uuid", str(following_id))
            print(f"  {i:2d}. meg123 now follows {username}")
        
        # Verify the counts
        print("\n📊 Verifying follower counts...")
        
        meg123_followers = await conn.fetchval("SELECT COUNT(*) FROM user_follows WHERE following_id = $1", meg123_id)
        meg123_following = await conn.fetchval("SELECT COUNT(*) FROM user_follows WHERE follower_id = $1", meg123_id)
        
        print(f"✅ meg123 now has {meg123_followers} followers")
        print(f"✅ meg123 now follows {meg123_following} users")
        
        # Update follower/following counts in user_profiles (triggers should handle this, but let's verify)
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
        print(f"📈 Created {len(created_user_ids)} new users")
        print(f"👥 Set up {len(followers_of_meg123)} users following meg123")
        print(f"👥 Set up meg123 following {len(users_followed_by_meg123)} users")
        
        print("\n⚠️  Note: These users exist only in user_profiles table.")
        print("   For full functionality, they would need to be created through Supabase Auth.")
        print("   You can test the following system with these users.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        if 'conn' in locals():
            await conn.close()
            print("🔌 Database connection closed")

async def main():
    """Main function"""
    print("🚀 Starting user creation and following setup script...")
    print("=" * 60)
    
    await create_users_and_follows()
    
    print("=" * 60)
    print("✨ Script finished!")

if __name__ == "__main__":
    asyncio.run(main())

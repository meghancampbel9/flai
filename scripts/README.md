# User Creation Script

This script automatically creates 24 new users and sets up following relationships for testing the user following system.

## What it does:

1. **Creates 24 new users** with realistic usernames, display names, and bios
2. **Sets up following relationships:**
   - 15 users will follow `meg123`
   - `meg123` will follow 21 users

## Prerequisites:

1. **Apply the database migration** first:
   ```bash
   # Apply the migration through Supabase dashboard or CLI
   # File: supabase/migrations/20250128000000_create_user_following_system.sql
   ```

2. **Create meg123 and meg123 users** first:
   - These users must exist in your database before running the script
   - You can create them through the mobile app or Supabase dashboard

3. **Set DATABASE_URL environment variable:**
   ```bash
   export DATABASE_URL="postgresql://postgres:your_password@your_host:5432/postgres"
   ```

## How to run:

### Option 1: Using the shell script (recommended)
```bash
cd /home/meg/dev/flai
./scripts/run_create_users.sh
```

### Option 2: Running Python script directly
```bash
cd /home/meg/dev/flai
python3 scripts/create_test_users_simple.py
```

## What the script creates:

### Users created:
- alex_fashion, sarah_style, mike_trends, emma_chic, james_casual
- lisa_elegant, david_street, anna_vintage, tom_classic, sophie_modern
- chris_sporty, maya_bohemian, ryan_minimal, zoe_colorful, ben_formal
- luna_artistic, max_urban, nina_romantic, leo_edgy, iris_sustainable
- felix_preppy, ruby_glamorous, oscar_retro, lily_eclectic

### Following relationships:
- **meg123** will have 15 followers
- **meg123** will follow 21 users

## Important Notes:

⚠️ **These users exist only in the `user_profiles` table**
- For full authentication functionality, users would need to be created through Supabase Auth
- This is sufficient for testing the following system and user search functionality
- The users can be searched, viewed, and followed/unfollowed

## Testing the system:

After running the script, you can test:

1. **User Search**: Search for any of the created usernames
2. **User Profiles**: View profiles of meg123 and meg123 to see follower/following counts
3. **Follow/Unfollow**: Test the follow/unfollow functionality
4. **Followers/Following Lists**: View the lists to see the relationships

## Troubleshooting:

- **"User not found"**: Make sure meg123 and meg123 exist in your database
- **"DATABASE_URL not set"**: Set the environment variable with your Supabase connection string
- **"Permission denied"**: Make sure the script is executable: `chmod +x scripts/run_create_users.sh`
- **"asyncpg not found"**: Install it with `pip3 install asyncpg`

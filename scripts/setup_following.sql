-- SQL Script to Set Up Following Relationships
-- Run this script in your Supabase SQL editor or psql

-- First, fix the trigger function to handle UUID casting properly
-- Drop triggers first, then function
DROP TRIGGER IF EXISTS trigger_update_follow_counts_insert ON public.user_follows;
DROP TRIGGER IF EXISTS trigger_update_follow_counts_delete ON public.user_follows;
DROP TRIGGER IF EXISTS update_follow_counts_trigger ON public.user_follows;
DROP FUNCTION IF EXISTS update_follow_counts() CASCADE;

-- Create function to update follow counts with proper UUID casting
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Update followers count for the user being followed
    IF TG_OP = 'INSERT' THEN
        UPDATE user_profiles 
        SET followers_count = followers_count + 1
        WHERE user_id::text = NEW.following_id::text;
        
        UPDATE user_profiles 
        SET following_count = following_count + 1
        WHERE user_id::text = NEW.follower_id::text;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE user_profiles 
        SET followers_count = followers_count - 1
        WHERE user_id::text = OLD.following_id::text;
        
        UPDATE user_profiles 
        SET following_count = following_count - 1
        WHERE user_id::text = OLD.follower_id::text;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers
CREATE TRIGGER trigger_update_follow_counts_insert
    AFTER INSERT ON public.user_follows
    FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

CREATE TRIGGER trigger_update_follow_counts_delete
    AFTER DELETE ON public.user_follows
    FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- Now proceed with the main script

-- First, let's check if meg123 exists and get the user IDs
SELECT 'meg123 user check:' as info, user_id FROM user_profiles WHERE username = 'meg123';

-- Get all test users
SELECT 'Test users:' as info, username, user_id FROM user_profiles 
WHERE username IN (
    'alex_fashion', 'sarah_style', 'mike_trends', 'emma_chic', 'james_casual',
    'lisa_elegant', 'david_street', 'anna_vintage', 'tom_classic', 'sophie_modern',
    'chris_sporty', 'maya_bohemian', 'ryan_minimal', 'zoe_colorful', 'ben_formal',
    'luna_artistic', 'max_urban', 'nina_romantic', 'leo_edgy', 'iris_sustainable',
    'felix_preppy', 'ruby_glamorous', 'oscar_retro', 'lily_eclectic'
)
ORDER BY username;

-- Set up following relationships
-- 15 users follow meg123
INSERT INTO user_follows (follower_id, following_id, created_at)
SELECT 
    up.user_id::uuid as follower_id,
    (SELECT user_id::uuid FROM user_profiles WHERE username = 'meg123') as following_id,
    NOW() as created_at
FROM user_profiles up
WHERE up.username IN (
    'alex_fashion', 'sarah_style', 'mike_trends', 'emma_chic', 'james_casual',
    'lisa_elegant', 'david_street', 'anna_vintage', 'tom_classic', 'sophie_modern',
    'chris_sporty', 'maya_bohemian', 'ryan_minimal', 'zoe_colorful'
)
ON CONFLICT (follower_id, following_id) DO NOTHING;

-- meg123 follows 21 users
INSERT INTO user_follows (follower_id, following_id, created_at)
SELECT 
    (SELECT user_id::uuid FROM user_profiles WHERE username = 'meg123') as follower_id,
    up.user_id::uuid as following_id,
    NOW() as created_at
FROM user_profiles up
WHERE up.username IN (
    'alex_fashion', 'sarah_style', 'mike_trends', 'emma_chic', 'james_casual',
    'lisa_elegant', 'david_street', 'anna_vintage', 'tom_classic', 'sophie_modern',
    'chris_sporty', 'maya_bohemian', 'ryan_minimal', 'zoe_colorful', 'ben_formal',
    'luna_artistic', 'max_urban', 'nina_romantic', 'leo_edgy', 'iris_sustainable',
    'felix_preppy'
)
ON CONFLICT (follower_id, following_id) DO NOTHING;

-- Verify the results
SELECT 'meg123 followers:' as info, COUNT(*) as count 
FROM user_follows 
WHERE following_id::text = (SELECT user_id::text FROM user_profiles WHERE username = 'meg123');

SELECT 'meg123 following:' as info, COUNT(*) as count 
FROM user_follows 
WHERE follower_id::text = (SELECT user_id::text FROM user_profiles WHERE username = 'meg123');

-- Update follower/following counts in user_profiles
UPDATE user_profiles 
SET followers_count = (
    SELECT COUNT(*) FROM user_follows 
    WHERE following_id::text = user_profiles.user_id::text
),
following_count = (
    SELECT COUNT(*) FROM user_follows 
    WHERE follower_id::text = user_profiles.user_id::text
)
WHERE username = 'meg123';

-- Show final results
SELECT 'Final meg123 stats:' as info, username, followers_count, following_count 
FROM user_profiles 
WHERE username = 'meg123';

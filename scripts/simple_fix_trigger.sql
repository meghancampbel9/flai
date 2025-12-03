-- Simple fix for the trigger function UUID casting issue
-- Run this script in your Supabase SQL editor

-- Just recreate the function with proper UUID casting (no dropping needed)
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

-- Show that the function is fixed
SELECT 'Trigger function fixed!' as status;

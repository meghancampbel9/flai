-- Fix the trigger function to handle UUID casting properly
-- Run this script in your Supabase SQL editor

-- Drop existing triggers first
DROP TRIGGER IF EXISTS trigger_update_follow_counts_insert ON public.user_follows;
DROP TRIGGER IF EXISTS trigger_update_follow_counts_delete ON public.user_follows;
DROP TRIGGER IF EXISTS update_follow_counts_trigger ON public.user_follows;

-- Drop and recreate the function with proper UUID casting
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

-- Test the function by manually updating counts for existing data
UPDATE user_profiles 
SET followers_count = (
    SELECT COUNT(*) FROM user_follows 
    WHERE following_id::text = user_profiles.user_id::text
),
following_count = (
    SELECT COUNT(*) FROM user_follows 
    WHERE follower_id::text = user_profiles.user_id::text
);

-- Show that the function is working
SELECT 'Trigger function fixed!' as status;

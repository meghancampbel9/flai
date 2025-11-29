-- Migration: Create user following system
-- Add followers/following functionality to the platform

-- Create user_follows table for following relationships
CREATE TABLE IF NOT EXISTS public.user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure a user cannot follow themselves
    CONSTRAINT no_self_follow CHECK (follower_id != following_id),
    
    -- Ensure unique follow relationships
    UNIQUE(follower_id, following_id)
);

-- Create indexes for performance
CREATE INDEX idx_user_follows_follower_id ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following_id ON public.user_follows(following_id);
CREATE INDEX idx_user_follows_created_at ON public.user_follows(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_follows
CREATE POLICY "Users can view all follow relationships" ON public.user_follows
    FOR SELECT USING (true);

CREATE POLICY "Users can follow other users" ON public.user_follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow users they follow" ON public.user_follows
    FOR DELETE USING (auth.uid() = follower_id);

-- Add follower/following counts to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Create function to update follower/following counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Increment counts
        UPDATE public.user_profiles 
        SET followers_count = followers_count + 1 
        WHERE user_id = NEW.following_id;
        
        UPDATE public.user_profiles 
        SET following_count = following_count + 1 
        WHERE user_id = NEW.follower_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Decrement counts
        UPDATE public.user_profiles 
        SET followers_count = GREATEST(followers_count - 1, 0) 
        WHERE user_id = OLD.following_id;
        
        UPDATE public.user_profiles 
        SET following_count = GREATEST(following_count - 1, 0) 
        WHERE user_id = OLD.follower_id;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update counts
CREATE TRIGGER update_follow_counts_trigger
    AFTER INSERT OR DELETE ON public.user_follows
    FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- Create function to get user's followers
CREATE OR REPLACE FUNCTION get_user_followers(user_uuid UUID, limit_count INTEGER DEFAULT 20, offset_count INTEGER DEFAULT 0)
RETURNS TABLE (
    follower_id UUID,
    username TEXT,
    display_name TEXT,
    avatar_url TEXT,
    followed_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uf.follower_id,
        up.username,
        up.display_name,
        up.avatar_url,
        uf.created_at as followed_at
    FROM public.user_follows uf
    JOIN public.user_profiles up ON uf.follower_id = up.user_id
    WHERE uf.following_id = user_uuid
    ORDER BY uf.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user's following
CREATE OR REPLACE FUNCTION get_user_following(user_uuid UUID, limit_count INTEGER DEFAULT 20, offset_count INTEGER DEFAULT 0)
RETURNS TABLE (
    following_id UUID,
    username TEXT,
    display_name TEXT,
    avatar_url TEXT,
    followed_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uf.following_id,
        up.username,
        up.display_name,
        up.avatar_url,
        uf.created_at as followed_at
    FROM public.user_follows uf
    JOIN public.user_profiles up ON uf.following_id = up.user_id
    WHERE uf.follower_id = user_uuid
    ORDER BY uf.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to search users
CREATE OR REPLACE FUNCTION search_users(search_query TEXT, limit_count INTEGER DEFAULT 20, offset_count INTEGER DEFAULT 0)
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    followers_count INTEGER,
    following_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.user_id,
        up.username,
        up.display_name,
        up.avatar_url,
        up.bio,
        up.followers_count,
        up.following_count
    FROM public.user_profiles up
    WHERE 
        up.username ILIKE '%' || search_query || '%' OR
        up.display_name ILIKE '%' || search_query || '%'
    ORDER BY 
        CASE 
            WHEN up.username ILIKE search_query || '%' THEN 1
            WHEN up.display_name ILIKE search_query || '%' THEN 2
            ELSE 3
        END,
        up.followers_count DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

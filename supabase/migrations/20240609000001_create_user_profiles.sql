-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create user_profiles table to extend auth.users with additional profile data
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  phone_number TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  pinterest_board_analyzed TEXT, -- Store the Pinterest board URL they used for onboarding
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Add constraint to ensure username format
  CONSTRAINT username_format_check CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$')
);

-- Create user_style_preferences table to store style analysis results
CREATE TABLE public.user_style_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Style analysis data from Pinterest board analysis
  aesthetic_description TEXT,
  style_keywords TEXT[], -- Array of style keywords
  color_palette TEXT[], -- Array of preferred colors
  themes TEXT[], -- Array of style themes
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  
  -- Pinterest board info
  source_board_url TEXT,
  source_board_name TEXT,
  images_analyzed INTEGER DEFAULT 0,
  
  -- Analysis metadata
  analysis_date TIMESTAMPTZ DEFAULT NOW(),
  analysis_version TEXT DEFAULT '1.0', -- For tracking analysis algorithm versions
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create analyzed_images table for vector storage and RAG
CREATE TABLE public.analyzed_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  style_preference_id UUID REFERENCES public.user_style_preferences(id) ON DELETE CASCADE,
  
  -- Image data
  image_url TEXT NOT NULL,
  image_thumbnail_url TEXT,
  image_source TEXT, -- 'pinterest', 'upload', etc.
  image_width INTEGER,
  image_height INTEGER,
  
  -- Vector embeddings for similarity search
  image_embedding vector(1536), -- OpenAI CLIP embeddings are 1536 dimensions
  style_embedding vector(768), -- Sentence transformer embeddings for style description
  
  -- Analysis results for this specific image
  image_description TEXT,
  detected_styles TEXT[],
  detected_colors TEXT[],
  dominant_mood TEXT,
  aesthetic_score DECIMAL(3,2),
  
  -- Metadata
  analysis_confidence DECIMAL(3,2),
  pinterest_pin_id TEXT, -- If from Pinterest
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(id);

CREATE INDEX idx_style_preferences_user_id ON public.user_style_preferences(user_id);
CREATE INDEX idx_style_preferences_confidence ON public.user_style_preferences(confidence_score);

CREATE INDEX idx_analyzed_images_user_id ON public.analyzed_images(user_id);
CREATE INDEX idx_analyzed_images_style_pref_id ON public.analyzed_images(style_preference_id);

-- Create vector similarity search indexes
CREATE INDEX ON public.analyzed_images USING ivfflat (image_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON public.analyzed_images USING ivfflat (style_embedding vector_cosine_ops) WITH (lists = 100);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_style_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyzed_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_style_preferences
CREATE POLICY "Users can view own style preferences" ON public.user_style_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own style preferences" ON public.user_style_preferences
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for analyzed_images
CREATE POLICY "Users can view own analyzed images" ON public.analyzed_images
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own analyzed images" ON public.analyzed_images
  FOR ALL USING (auth.uid() = user_id);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_style_preferences_updated_at
  BEFORE UPDATE ON public.user_style_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a function to get similar images using vector search
CREATE OR REPLACE FUNCTION get_similar_images(
  query_embedding vector(1536),
  user_id_param UUID DEFAULT NULL,
  limit_param INTEGER DEFAULT 10,
  similarity_threshold DECIMAL DEFAULT 0.7
)
RETURNS TABLE (
  id UUID,
  image_url TEXT,
  image_description TEXT,
  similarity_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ai.id,
    ai.image_url,
    ai.image_description,
    (1 - (ai.image_embedding <=> query_embedding))::DECIMAL as similarity_score
  FROM public.analyzed_images ai
  WHERE 
    (user_id_param IS NULL OR ai.user_id = user_id_param)
    AND (1 - (ai.image_embedding <=> query_embedding)) > similarity_threshold
  ORDER BY ai.image_embedding <=> query_embedding
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get style recommendations
CREATE OR REPLACE FUNCTION get_style_recommendations(
  query_text TEXT,
  query_embedding vector(768),
  user_id_param UUID,
  limit_param INTEGER DEFAULT 5
)
RETURNS TABLE (
  image_url TEXT,
  image_description TEXT,
  detected_styles TEXT[],
  aesthetic_score DECIMAL,
  similarity_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ai.image_url,
    ai.image_description,
    ai.detected_styles,
    ai.aesthetic_score,
    (1 - (ai.style_embedding <=> query_embedding))::DECIMAL as similarity_score
  FROM public.analyzed_images ai
  WHERE ai.user_id = user_id_param
  ORDER BY ai.style_embedding <=> query_embedding
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql; 
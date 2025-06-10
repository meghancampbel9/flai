-- Migration: Restructure style analysis table
-- Add missing columns to flai_style_analysis, rename to style_analysis, and clean up unused tables

-- First, add missing columns to flai_style_analysis if they don't exist
ALTER TABLE public.flai_style_analysis 
ADD COLUMN IF NOT EXISTS images_analyzed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS analysis_date TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Rename flai_style_analysis to style_analysis for cleaner naming
ALTER TABLE public.flai_style_analysis RENAME TO style_analysis;

-- Update any existing indexes to use the new table name
DROP INDEX IF EXISTS idx_flai_style_analysis_user_id;
CREATE INDEX IF NOT EXISTS idx_style_analysis_user_id ON public.style_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_style_analysis_confidence ON public.style_analysis(confidence_score);

-- Update RLS policies for the renamed table
DROP POLICY IF EXISTS "Users can view own flai style analysis" ON public.style_analysis;
DROP POLICY IF EXISTS "Users can manage own flai style analysis" ON public.style_analysis;

CREATE POLICY "Users can view own style analysis" ON public.style_analysis
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own style analysis" ON public.style_analysis
  FOR ALL USING (auth.uid() = user_id);

-- Update trigger for updated_at
DROP TRIGGER IF EXISTS update_flai_style_analysis_updated_at ON public.style_analysis;
CREATE TRIGGER update_style_analysis_updated_at
  BEFORE UPDATE ON public.style_analysis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Drop the unused user_style_preferences table if it exists
DROP TABLE IF EXISTS public.user_style_preferences CASCADE;

-- Update analyzed_images table to reference the new table name if needed
-- (Check if there are any foreign key constraints that need updating)
ALTER TABLE public.analyzed_images 
DROP CONSTRAINT IF EXISTS analyzed_images_style_preference_id_fkey;

-- Add a new foreign key constraint to style_analysis if we want to link them
-- (This is optional - depends on if you want to link analyzed images to overall style analysis)
-- ALTER TABLE public.analyzed_images 
-- ADD CONSTRAINT analyzed_images_style_analysis_id_fkey 
-- FOREIGN KEY (style_preference_id) REFERENCES public.style_analysis(id) ON DELETE CASCADE; 
-- Update embedding dimensions to match Google's text-embedding-004 model (768 dimensions)
-- This migration updates the vector dimensions from 1536 (OpenAI CLIP) to 768 (Google)

-- Update analyzed_images table
ALTER TABLE analyzed_images 
  ALTER COLUMN image_embedding TYPE vector(768),
  ALTER COLUMN style_embedding TYPE vector(768);

-- Update any existing vector search functions if they exist
-- (Functions will automatically adapt to new dimensions)

-- Add comment for future reference
COMMENT ON COLUMN analyzed_images.image_embedding IS 'Google text-embedding-004 model embeddings (768 dimensions)';
COMMENT ON COLUMN analyzed_images.style_embedding IS 'Google text-embedding-004 model embeddings (768 dimensions)';

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'analyzed_images' 
  AND column_name IN ('image_embedding', 'style_embedding'); 
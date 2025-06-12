-- 1. Enable the pgvector extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    brand TEXT,
    price REAL NOT NULL,
    original_price REAL,
    currency TEXT NOT NULL,
    image_url TEXT NOT NULL,
    product_url TEXT NOT NULL UNIQUE,
    category TEXT,
    is_on_sale BOOLEAN DEFAULT FALSE,
    description TEXT,
    sizes TEXT[],
    colors TEXT[],
    material TEXT,
    gender_affinity TEXT,
    source TEXT NOT NULL,
    embedding vector(768), -- Matches the 768 dimensions from Google's AI model
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create a trigger to automatically update the updated_at column
CREATE OR REPLACE TRIGGER on_products_updated
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE PROCEDURE public.handle_updated_at();

-- 5. Add comments to the table and columns for clarity
COMMENT ON TABLE public.products IS 'Stores scraped product information for the e-commerce platform.';
COMMENT ON COLUMN public.products.embedding IS 'Vector embedding for similarity search generated from product description.'; 
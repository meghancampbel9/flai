-- Create a function to get the averaged style embedding for a user
CREATE OR REPLACE FUNCTION get_user_style_embedding(p_user_id UUID)
RETURNS vector(768) AS $$
DECLARE
    avg_embedding vector(768);
BEGIN
    SELECT AVG(style_embedding)
    INTO avg_embedding
    FROM public.analyzed_images
    WHERE user_id = p_user_id;

    RETURN avg_embedding;
END;
$$ LANGUAGE plpgsql;

-- Create a function to match products based on a style embedding
CREATE OR REPLACE FUNCTION match_products_by_style(
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  brand TEXT,
  price REAL,
  original_price REAL,
  currency TEXT,
  image_url TEXT,
  product_url TEXT,
  category TEXT,
  is_on_sale BOOLEAN,
  description TEXT,
  sizes TEXT[],
  colors TEXT[],
  material TEXT,
  gender_tag TEXT,
  source TEXT,
  similarity float
)
LANGUAGE sql STABLE AS $$
  SELECT
    p.id,
    p.name,
    p.brand,
    p.price,
    p.original_price,
    p.currency,
    p.image_url,
    p.product_url,
    p.category,
    p.is_on_sale,
    p.description,
    p.sizes,
    p.colors,
    p.material,
    p.gender_tag,
    p.source,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM public.products p
  WHERE 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$; 
-- Add shopping preference to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN shopping_preference TEXT DEFAULT 'everything';

-- Add constraint to ensure valid shopping preferences
ALTER TABLE public.user_profiles 
ADD CONSTRAINT shopping_preference_check 
CHECK (shopping_preference IN ('womenswear', 'menswear', 'everything'));

-- Add comment for clarity
COMMENT ON COLUMN public.user_profiles.shopping_preference IS 'User shopping preference: womenswear, menswear, or everything'; 
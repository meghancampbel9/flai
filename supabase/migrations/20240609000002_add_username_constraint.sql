-- Add username format constraint to existing user_profiles table
-- This is safe to run even if the constraint already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'username_format_check' 
    AND table_name = 'user_profiles'
  ) THEN
    ALTER TABLE public.user_profiles 
    ADD CONSTRAINT username_format_check 
    CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$');
  END IF;
END $$; 
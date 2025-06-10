-- Note: We don't modify auth.users directly due to permissions
-- Username will be stored in user_profiles table instead

-- Create a function to check username availability in user_profiles
CREATE OR REPLACE FUNCTION check_username_availability(username_to_check TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.user_profiles WHERE username = username_to_check
  );
END;
$$ LANGUAGE plpgsql; 
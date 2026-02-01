-- Add social_links column to profiles table for storing external social media links
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.social_links IS 'JSON object storing external social media links like threads, bluesky, instagram, etc.';
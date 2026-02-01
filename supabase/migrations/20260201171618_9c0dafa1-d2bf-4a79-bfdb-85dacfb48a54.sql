-- Add interests column to profiles
ALTER TABLE public.profiles
ADD COLUMN interests text[] DEFAULT '{}';

-- Add image_url column to posts for photo attachments
ALTER TABLE public.posts
ADD COLUMN image_url text;

-- Create an index for interests search
CREATE INDEX idx_profiles_interests ON public.profiles USING GIN(interests);
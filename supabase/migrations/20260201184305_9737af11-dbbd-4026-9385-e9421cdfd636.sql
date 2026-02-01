-- Add verification fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_tier text DEFAULT null;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.is_verified IS 'Whether the profile is verified';
COMMENT ON COLUMN public.profiles.verification_tier IS 'Type of verification: founder, notable, verified, etc.';

-- Create verification requests table
CREATE TABLE public.verification_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  links text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewer_notes text
);

-- Enable RLS
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view their own verification requests"
ON public.verification_requests
FOR SELECT
USING (profile_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Users can create their own requests
CREATE POLICY "Users can create their own verification requests"
ON public.verification_requests
FOR INSERT
WITH CHECK (profile_id IN (SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_verification_requests_profile_id ON public.verification_requests(profile_id);
CREATE INDEX idx_verification_requests_status ON public.verification_requests(status);
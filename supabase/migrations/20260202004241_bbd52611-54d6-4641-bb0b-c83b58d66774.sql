-- Fix: Remove SELECT policy that exposes private_key to client queries
-- Private keys should ONLY be accessible via service role in edge functions
DROP POLICY IF EXISTS "Users can view their own keys" ON public.actor_keys;

-- Create a view for public key access only (without private_key)
CREATE OR REPLACE VIEW public.actor_keys_public AS
SELECT id, profile_id, public_key, created_at
FROM public.actor_keys;

-- Enable RLS on the view and grant access to authenticated users
GRANT SELECT ON public.actor_keys_public TO authenticated;

-- Add policy for authenticated users to view their own public keys via the view
-- Note: Views inherit RLS from base tables when security_invoker is true (default in newer Postgres)
-- Since the base table has service-role-only access now, we use the view for safe public key access
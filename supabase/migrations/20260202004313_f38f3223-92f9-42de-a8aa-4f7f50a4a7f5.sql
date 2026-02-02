-- Fix the view to use SECURITY INVOKER (safer - uses caller's permissions)
DROP VIEW IF EXISTS public.actor_keys_public;

CREATE VIEW public.actor_keys_public 
WITH (security_invoker = true)
AS
SELECT id, profile_id, public_key, created_at
FROM public.actor_keys;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.actor_keys_public TO authenticated;
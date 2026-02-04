-- Drop federation-related tables (order matters due to foreign keys)
DROP TABLE IF EXISTS public.federation_follows CASCADE;
DROP TABLE IF EXISTS public.federation_activities CASCADE;

-- Drop the view before the table it references
DROP VIEW IF EXISTS public.actor_keys_public;
DROP TABLE IF EXISTS public.actor_keys CASCADE;

-- Drop remote_actors table
DROP TABLE IF EXISTS public.remote_actors CASCADE;

-- Remove unused federation columns from profiles
ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS actor_id,
  DROP COLUMN IF EXISTS inbox_url,
  DROP COLUMN IF EXISTS public_key;

-- Drop federation-related trigger function
DROP FUNCTION IF EXISTS public.sync_actor_to_profile() CASCADE;
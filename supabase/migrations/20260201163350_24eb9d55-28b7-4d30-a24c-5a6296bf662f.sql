-- Create table for user RSA keypairs (required for HTTP Signatures)
CREATE TABLE public.actor_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,
  private_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id)
);

-- Enable RLS
ALTER TABLE public.actor_keys ENABLE ROW LEVEL SECURITY;

-- Users can only read their own keys
CREATE POLICY "Users can view their own keys"
ON public.actor_keys FOR SELECT
USING (profile_id IN (
  SELECT id FROM profiles WHERE user_id = auth.uid()
));

-- System creates keys, users shouldn't insert directly
CREATE POLICY "Service role can manage keys"
ON public.actor_keys FOR ALL
USING (true)
WITH CHECK (true);

-- Create table for remote actors (users from other instances)
CREATE TABLE public.remote_actors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_uri TEXT NOT NULL UNIQUE,
  inbox_url TEXT NOT NULL,
  outbox_url TEXT,
  shared_inbox_url TEXT,
  username TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  public_key TEXT,
  public_key_id TEXT,
  instance TEXT NOT NULL,
  followers_url TEXT,
  following_url TEXT,
  summary TEXT,
  raw_actor JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS - remote actors are publicly readable
ALTER TABLE public.remote_actors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Remote actors are publicly readable"
ON public.remote_actors FOR SELECT
USING (true);

-- Create table for federation follows (local follows remote, remote follows local)
CREATE TABLE public.federation_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- For outgoing follows (local -> remote)
  local_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  remote_actor_id UUID REFERENCES public.remote_actors(id) ON DELETE CASCADE,
  -- For incoming follows (remote -> local)
  remote_follower_id UUID REFERENCES public.remote_actors(id) ON DELETE CASCADE,
  local_followed_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  -- Direction
  direction TEXT NOT NULL CHECK (direction IN ('outgoing', 'incoming')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.federation_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their federation follows"
ON public.federation_follows FOR SELECT
USING (
  local_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) OR
  local_followed_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can manage their outgoing follows"
ON public.federation_follows FOR INSERT
WITH CHECK (
  direction = 'outgoing' AND
  local_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete their follows"
ON public.federation_follows FOR DELETE
USING (
  local_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
);

-- Create table for activity log (for debugging and replay)
CREATE TABLE public.federation_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  actor_uri TEXT NOT NULL,
  object_uri TEXT,
  target_uri TEXT,
  raw_activity JSONB NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.federation_activities ENABLE ROW LEVEL SECURITY;

-- Only service role should access activities (no user policy needed)
CREATE POLICY "Service role can manage activities"
ON public.federation_activities FOR ALL
USING (true);

-- Add indexes for performance
CREATE INDEX idx_remote_actors_instance ON public.remote_actors(instance);
CREATE INDEX idx_remote_actors_username ON public.remote_actors(username);
CREATE INDEX idx_federation_activities_actor ON public.federation_activities(actor_uri);
CREATE INDEX idx_federation_activities_status ON public.federation_activities(status);

-- Add trigger for updated_at
CREATE TRIGGER update_remote_actors_updated_at
BEFORE UPDATE ON public.remote_actors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_federation_follows_updated_at
BEFORE UPDATE ON public.federation_follows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
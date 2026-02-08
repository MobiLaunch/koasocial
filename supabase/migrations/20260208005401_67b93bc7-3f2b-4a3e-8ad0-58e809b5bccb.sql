-- Fix search_path on all functions missing it

-- Fix get_or_create_conversation (missing search_path)
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(user_a uuid, user_b uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    convo_id uuid;
BEGIN
    -- Look for existing
    SELECT p1.conversation_id INTO convo_id
    FROM conversation_participants p1
    JOIN conversation_participants p2 ON p1.conversation_id = p2.conversation_id
    WHERE p1.profile_id = user_a AND p2.profile_id = user_b
    LIMIT 1;

    -- Create if missing
    IF convo_id IS NULL THEN
        INSERT INTO conversations (created_at)
        VALUES (now())
        RETURNING id INTO convo_id;

        INSERT INTO conversation_participants (conversation_id, profile_id)
        VALUES (convo_id, user_a), (convo_id, user_b);
    END IF;

    RETURN convo_id;
END;
$function$;

-- Fix handle_new_boost (missing search_path)
CREATE OR REPLACE FUNCTION public.handle_new_boost()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO notifications (recipient_id, actor_id, type, entity_id)
  SELECT 
    p.author_id, 
    NEW.user_id, 
    'boost', 
    NEW.post_id
  FROM posts p 
  WHERE p.id = NEW.post_id;
  RETURN NEW;
END;
$function$;

-- Fix handle_new_favorite (missing search_path)
CREATE OR REPLACE FUNCTION public.handle_new_favorite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO notifications (recipient_id, actor_id, type, entity_id)
  SELECT 
    p.author_id,
    NEW.user_id,
    'like', 
    NEW.post_id
  FROM posts p 
  WHERE p.id = NEW.post_id;
  RETURN NEW;
END;
$function$;

-- Fix handle_new_follow (missing search_path)
CREATE OR REPLACE FUNCTION public.handle_new_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO notifications (recipient_id, actor_id, type, entity_id)
  VALUES (
    NEW.following_id,
    NEW.follower_id,
    'follow', 
    NEW.id
  );
  RETURN NEW;
END;
$function$;

-- Fix notify_on_follow (missing search_path)
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO notifications (recipient_id, actor_id, type, entity_id)
  VALUES (NEW.following_id, NEW.follower_id, 'follow', NEW.id);
  RETURN NEW;
END;
$function$;

-- Fix overly permissive RLS policies on conversations
-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can insert conversations" ON public.conversations;

-- The "Authenticated users can create conversations" policy already exists and is acceptable
-- since conversations are created through get_or_create_conversation function
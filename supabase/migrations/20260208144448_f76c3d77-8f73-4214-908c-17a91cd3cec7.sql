-- Fix security warnings: overly permissive hashtags policy and search_path issues

-- 1. Drop the overly permissive policy
DROP POLICY IF EXISTS "System can manage hashtags" ON public.hashtags;

-- 2. Add proper function-based search_path fixes for existing functions
-- Note: The get_or_create_conversation and handle_new_message_notification already have security definer
-- but may be missing search_path. Let's ensure all are properly configured.

-- Fix handle_new_message_notification to have search_path
CREATE OR REPLACE FUNCTION public.handle_new_message_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  recipient_id uuid;
BEGIN
  SELECT profile_id INTO recipient_id
  FROM public.conversation_participants
  WHERE conversation_id = NEW.conversation_id
  AND profile_id != NEW.sender_id
  LIMIT 1;

  IF recipient_id IS NOT NULL THEN
    INSERT INTO public.notifications (recipient_id, actor_id, type, entity_id, is_read)
    VALUES (recipient_id, NEW.sender_id, 'message', NEW.conversation_id, false);
  END IF;

  RETURN NEW;
END;
$$;

-- Fix get_or_create_conversation to have search_path
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(user_a uuid, user_b uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  calling_user_id uuid;
  conv_id uuid;
BEGIN
  calling_user_id := auth.uid();

  IF calling_user_id IS NULL OR user_a != calling_user_id THEN
    RAISE EXCEPTION 'Security Violation: You can only create conversations for yourself.';
  END IF;

  SELECT cp1.conversation_id INTO conv_id
  FROM public.conversation_participants cp1
  JOIN public.conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.profile_id = user_a 
  AND cp2.profile_id = user_b
  LIMIT 1;

  IF conv_id IS NULL THEN
    INSERT INTO public.conversations DEFAULT VALUES RETURNING id INTO conv_id;
    INSERT INTO public.conversation_participants (conversation_id, profile_id) VALUES (conv_id, user_a);
    INSERT INTO public.conversation_participants (conversation_id, profile_id) VALUES (conv_id, user_b);
  END IF;

  RETURN conv_id;
END;
$$;
-- Add search_path to the functions we just created for security
CREATE OR REPLACE FUNCTION public.notify_on_favorite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_recipient_id UUID;
BEGIN
  SELECT author_id INTO v_recipient_id FROM posts WHERE id = NEW.post_id;
  IF v_recipient_id IS DISTINCT FROM NEW.user_id THEN
    INSERT INTO notifications (recipient_id, actor_id, type, entity_id)
    VALUES (v_recipient_id, NEW.user_id, 'like', NEW.post_id);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_on_boost()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_recipient_id UUID;
BEGIN
  SELECT author_id INTO v_recipient_id FROM posts WHERE id = NEW.post_id;
  IF v_recipient_id IS DISTINCT FROM NEW.user_id THEN
    INSERT INTO notifications (recipient_id, actor_id, type, entity_id)
    VALUES (v_recipient_id, NEW.user_id, 'boost', NEW.post_id);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_recipient_id UUID;
BEGIN
  SELECT profile_id INTO v_recipient_id FROM conversation_participants 
  WHERE conversation_id = NEW.conversation_id AND profile_id != NEW.sender_id LIMIT 1;

  IF v_recipient_id IS NOT NULL THEN
    INSERT INTO notifications (recipient_id, actor_id, type, entity_id)
    VALUES (v_recipient_id, NEW.sender_id, 'message', NEW.conversation_id);
  END IF;
  RETURN NEW;
END;
$function$;
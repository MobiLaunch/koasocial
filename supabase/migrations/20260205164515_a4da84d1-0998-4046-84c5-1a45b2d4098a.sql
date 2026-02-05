-- Fix notify_on_favorite: posts.user_id -> posts.author_id
CREATE OR REPLACE FUNCTION public.notify_on_favorite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Fix notify_on_boost: posts.user_id -> posts.author_id  
CREATE OR REPLACE FUNCTION public.notify_on_boost()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Fix notify_on_message: user_id -> profile_id
CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create triggers for favorites and boosts (if missing)
DROP TRIGGER IF EXISTS tr_notify_on_favorite ON public.favorites;
CREATE TRIGGER tr_notify_on_favorite
  AFTER INSERT ON public.favorites
  FOR EACH ROW EXECUTE FUNCTION notify_on_favorite();

DROP TRIGGER IF EXISTS tr_notify_on_boost ON public.boosts;
CREATE TRIGGER tr_notify_on_boost
  AFTER INSERT ON public.boosts
  FOR EACH ROW EXECUTE FUNCTION notify_on_boost();

-- Create the message trigger (was missing)
DROP TRIGGER IF EXISTS tr_notify_on_message ON public.messages;
CREATE TRIGGER tr_notify_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION notify_on_message();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
-- Phase 6 & 7 & 8: Database changes for hashtags, mentions, read receipts, and notifications

-- 1. Create hashtags tracking table
CREATE TABLE public.hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag TEXT NOT NULL UNIQUE,
  usage_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on hashtags
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;

-- Anyone can read hashtags
CREATE POLICY "Anyone can view hashtags"
ON public.hashtags FOR SELECT
USING (true);

-- Authenticated users can insert/update hashtags (will be done via trigger)
CREATE POLICY "System can manage hashtags"
ON public.hashtags FOR ALL
USING (true)
WITH CHECK (true);

-- 2. Add read_at column to messages for read receipts
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- 3. Create RLS policy for updating messages (marking as read)
CREATE POLICY "Users can mark messages as read"
ON public.messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = messages.conversation_id
    AND cp.profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

-- 4. Create notification RLS policies for update and delete
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (recipient_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (recipient_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- 5. Create function to notify on mentions
CREATE OR REPLACE FUNCTION public.notify_on_mention()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  mentioned_username TEXT;
  mentioned_profile_id UUID;
BEGIN
  -- Extract mentions from post content using regex
  FOR mentioned_username IN 
    SELECT (regexp_matches(NEW.content, '@([a-zA-Z0-9_]+)', 'g'))[1]
  LOOP
    -- Find the profile ID for the mentioned username
    SELECT id INTO mentioned_profile_id 
    FROM profiles WHERE username = mentioned_username;
    
    -- Create notification if user exists and isn't the author
    IF mentioned_profile_id IS NOT NULL AND mentioned_profile_id != NEW.author_id THEN
      INSERT INTO notifications (recipient_id, actor_id, type, entity_id)
      VALUES (mentioned_profile_id, NEW.author_id, 'mention', NEW.id);
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

-- 6. Create trigger for mention notifications
DROP TRIGGER IF EXISTS trigger_notify_on_mention ON public.posts;
CREATE TRIGGER trigger_notify_on_mention
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_mention();

-- 7. Create function to track hashtags
CREATE OR REPLACE FUNCTION public.track_hashtags()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  hashtag TEXT;
BEGIN
  -- Extract hashtags from post content
  FOR hashtag IN 
    SELECT lower((regexp_matches(NEW.content, '#([a-zA-Z0-9_]+)', 'g'))[1])
  LOOP
    -- Upsert hashtag
    INSERT INTO hashtags (tag, usage_count, last_used_at)
    VALUES (hashtag, 1, NOW())
    ON CONFLICT (tag) 
    DO UPDATE SET 
      usage_count = hashtags.usage_count + 1,
      last_used_at = NOW();
  END LOOP;
  RETURN NEW;
END;
$$;

-- 8. Create trigger for hashtag tracking
DROP TRIGGER IF EXISTS trigger_track_hashtags ON public.posts;
CREATE TRIGGER trigger_track_hashtags
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.track_hashtags();

-- 9. Create function to notify on replies
CREATE OR REPLACE FUNCTION public.notify_on_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_recipient_id UUID;
BEGIN
  -- Only process if this is a reply
  IF NEW.reply_to_id IS NOT NULL THEN
    -- Get the author of the original post
    SELECT author_id INTO v_recipient_id 
    FROM posts WHERE id = NEW.reply_to_id;
    
    -- Create notification if recipient exists and isn't the author
    IF v_recipient_id IS NOT NULL AND v_recipient_id != NEW.author_id THEN
      INSERT INTO notifications (recipient_id, actor_id, type, entity_id)
      VALUES (v_recipient_id, NEW.author_id, 'reply', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 10. Create trigger for reply notifications
DROP TRIGGER IF EXISTS trigger_notify_on_reply ON public.posts;
CREATE TRIGGER trigger_notify_on_reply
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_reply();
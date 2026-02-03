-- Fix the infinite recursion in conversation_participants RLS policies
-- by using a security definer function

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "participant_select_policy" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can update their own participant record" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can update their participation" ON public.conversation_participants;

-- Create a security definer function to get user's profile ID
CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- Create a security definer function to check if user is in a conversation
CREATE OR REPLACE FUNCTION public.is_participant_in_conversation(conv_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conv_id
    AND cp.profile_id = public.get_my_profile_id()
  )
$$;

-- Create new RLS policies using the security definer function
CREATE POLICY "Users can view their conversation participants"
ON public.conversation_participants FOR SELECT
USING (
  profile_id = public.get_my_profile_id() OR
  public.is_participant_in_conversation(conversation_id)
);

CREATE POLICY "Users can update their own participation"
ON public.conversation_participants FOR UPDATE
USING (profile_id = public.get_my_profile_id());

-- Also fix the messages policies that might reference conversation_participants
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages into their conversations" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;

-- Create clean message policies using the security definer function
CREATE POLICY "Users can view their messages"
ON public.messages FOR SELECT
USING (public.is_participant_in_conversation(conversation_id));

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (
  sender_id = public.get_my_profile_id() AND
  public.is_participant_in_conversation(conversation_id)
);

-- Fix conversations policies similarly
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update conversations they are in" ON public.conversations;
DROP POLICY IF EXISTS "Participants can delete conversations" ON public.conversations;

CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT
USING (public.is_participant_in_conversation(id));

CREATE POLICY "Users can update their conversations"
ON public.conversations FOR UPDATE
USING (public.is_participant_in_conversation(id));

CREATE POLICY "Users can delete their conversations"
ON public.conversations FOR DELETE
USING (public.is_participant_in_conversation(id));
-- Create conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversation participants junction table
CREATE TABLE public.conversation_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(conversation_id, profile_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversations: users can view conversations they're part of
CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT
USING (
  id IN (
    SELECT conversation_id FROM public.conversation_participants
    WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- Conversations: users can create conversations
CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (true);

-- Participants: users can view participants of their conversations
CREATE POLICY "Users can view conversation participants"
ON public.conversation_participants FOR SELECT
USING (
  conversation_id IN (
    SELECT conversation_id FROM public.conversation_participants
    WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- Participants: users can add themselves to conversations
CREATE POLICY "Users can join conversations"
ON public.conversation_participants FOR INSERT
WITH CHECK (
  profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Participants: users can update their own participation (for read receipts)
CREATE POLICY "Users can update their participation"
ON public.conversation_participants FOR UPDATE
USING (
  profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Messages: users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
USING (
  conversation_id IN (
    SELECT conversation_id FROM public.conversation_participants
    WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- Messages: users can send messages to their conversations
CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (
  sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  AND conversation_id IN (
    SELECT conversation_id FROM public.conversation_participants
    WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;

-- Add triggers for updated_at
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
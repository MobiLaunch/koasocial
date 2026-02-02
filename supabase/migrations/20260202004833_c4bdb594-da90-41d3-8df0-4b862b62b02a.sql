-- Add UPDATE policy for conversations (needed for timestamp updates)
CREATE POLICY "Participants can update conversations"
ON public.conversations FOR UPDATE
USING (
  id IN (
    SELECT conversation_id 
    FROM conversation_participants
    WHERE profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

-- Add DELETE policy for conversations (any participant can delete)
CREATE POLICY "Participants can delete conversations"
ON public.conversations FOR DELETE
USING (
  id IN (
    SELECT conversation_id 
    FROM conversation_participants
    WHERE profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
);
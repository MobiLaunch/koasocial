-- Drop the overly permissive policy
DROP POLICY "Users can create conversations" ON public.conversations;

-- Create a more secure policy - users can create conversations if they're authenticated
CREATE POLICY "Authenticated users can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
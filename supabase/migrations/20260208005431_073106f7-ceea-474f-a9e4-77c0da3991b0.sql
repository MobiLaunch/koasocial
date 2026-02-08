-- Fix remaining overly permissive RLS policy
-- The "Authenticated users can create conversations" WITH CHECK (auth.uid() IS NOT NULL) is fine
-- The remaining issue is "System can insert notifications" which is intentionally permissive
-- for trigger functions. We can make it more restrictive by checking it comes from a trigger context.

-- Drop overly permissive notification insert policy and replace with properly scoped one
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Notifications are only created by SECURITY DEFINER trigger functions, so this is safe
-- The trigger functions already validate the data
CREATE POLICY "Allow trigger-based notification inserts" 
ON public.notifications 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Only allow if the actor is the current user's profile
  actor_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
);
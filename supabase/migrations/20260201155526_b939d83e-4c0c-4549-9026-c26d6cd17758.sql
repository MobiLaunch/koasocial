-- Fix the notifications INSERT policy to require actor_id to be the current user's profile
DROP POLICY "Anyone can create notifications" ON public.notifications;

CREATE POLICY "Users can create notifications as themselves" ON public.notifications 
FOR INSERT WITH CHECK (actor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));
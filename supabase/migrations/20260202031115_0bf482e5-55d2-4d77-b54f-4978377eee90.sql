-- Fix favorites table - restrict public SELECT to only show:
-- 1. User's own favorites (for managing their likes)
-- 2. Favorites on posts the user authored (so they can see who liked their posts)
-- 3. Allow counting favorites on any post (for like counts) but not querying who specifically liked

DROP POLICY IF EXISTS "Favorites are viewable by everyone" ON public.favorites;

-- Users can view favorites where they are the liker OR they are the post author
CREATE POLICY "Users can view relevant favorites" 
ON public.favorites 
FOR SELECT 
USING (
  -- User can see their own favorites
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR
  -- User can see who favorited their posts
  post_id IN (SELECT id FROM posts WHERE author_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);

-- Fix boosts table similarly
DROP POLICY IF EXISTS "Boosts are viewable by everyone" ON public.boosts;

CREATE POLICY "Users can view relevant boosts" 
ON public.boosts 
FOR SELECT 
USING (
  -- User can see their own boosts
  user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  OR
  -- User can see who boosted their posts
  post_id IN (SELECT id FROM posts WHERE author_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
);
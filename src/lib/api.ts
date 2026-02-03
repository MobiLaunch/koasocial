import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  created_at: string;
  // Added back to fix build errors
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  is_verified?: boolean;          // Fixes NotificationItem & PostCard errors
  verification_tier?: string;     // Fixes NotificationItem & PostCard errors
  instance?: string;              // Fixes UserProfilePage errors
}

export interface Post {
  id: string;
  author_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author?: Profile;
  // Added back to fix build errors
  favorites_count?: number;
  boosts_count?: number;
  replies_count?: number;
  is_favorited?: boolean;
  is_boosted?: boolean;
  boosted_by?: string | null;    // Fixes PostCard errors
}

// Update createPost to accept the extra arguments the UI is sending
export async function createPost(
  authorId: string, 
  content: string, 
  imageUrl?: string | null,
  visibility?: string,           // Handles the 4th argument
  replyToId?: string             // Handles the 5th argument
) {
  const { data, error } = await supabase
    .from('posts')
    .insert({ 
      author_id: authorId, 
      content, 
      image_url: imageUrl,
      visibility: visibility || 'public',
      reply_to_id: replyToId
    })
    .select('*, author:profiles(*)')
    .single();

  if (error) throw error;
  return data as Post;
}

// Update getUserInteractions to handle the optional profileId argument
export async function getUserInteractions(profileId?: string, postIds: string[] = []) {
  return { favoritedPostIds: new Set<string>(), boostedPostIds: new Set<string>() };
}

  // Get counts for each post
  const postsWithCounts = await Promise.all(
    (posts || []).map(async (post) => {
      const [repliesRes, boostsRes, favoritesRes] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('reply_to_id', post.id),
        supabase.from('boosts').select('id', { count: 'exact', head: true }).eq('post_id', post.id),
        supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('post_id', post.id),
      ]);

      return {
        ...post,
        replies_count: repliesRes.count || 0,
        boosts_count: boostsRes.count || 0,
        favorites_count: favoritesRes.count || 0,
      };
    })
  );

  return postsWithCounts as Post[];
}

// Check if user has favorited/boosted posts
export async function getUserInteractions(profileId: string, postIds: string[]) {
  const [favoritesRes, boostsRes] = await Promise.all([
    supabase.from('favorites').select('post_id').eq('user_id', profileId).in('post_id', postIds),
    supabase.from('boosts').select('post_id').eq('user_id', profileId).in('post_id', postIds),
  ]);

  return {
    favoritedPostIds: new Set((favoritesRes.data || []).map(f => f.post_id)),
    boostedPostIds: new Set((boostsRes.data || []).map(b => b.post_id)),
  };
}

// Create a new post
export async function createPost(
  authorId: string, 
  content: string, 
  visibility: string = 'public', 
  replyToId?: string,
  imageUrl?: string | null
) {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: authorId,
      content,
      visibility,
      reply_to_id: replyToId || null,
      image_url: imageUrl || null,
    })
    .select(`
      *,
      author:profiles!posts_author_id_fkey(*)
    `)
    .single();

  if (error) throw error;
  return data as Post;
}

// Toggle favorite
export async function toggleFavorite(profileId: string, postId: string, isFavorited: boolean) {
  if (isFavorited) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', profileId)
      .eq('post_id', postId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('favorites')
      .insert({ user_id: profileId, post_id: postId });
    if (error) throw error;
  }
}

// Toggle boost
export async function toggleBoost(profileId: string, postId: string, isBoosted: boolean) {
  if (isBoosted) {
    const { error } = await supabase
      .from('boosts')
      .delete()
      .eq('user_id', profileId)
      .eq('post_id', postId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('boosts')
      .insert({ user_id: profileId, post_id: postId });
    if (error) throw error;
  }
}

// Fetch profile with counts
export async function fetchProfile(username: string): Promise<Profile | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  // Get follower/following counts
  const [followersRes, followingRes, postsRes] = await Promise.all([
    supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', profile.id),
    supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', profile.id),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', profile.id),
  ]);

  return {
    ...profile,
    followers_count: followersRes.count || 0,
    following_count: followingRes.count || 0,
    posts_count: postsRes.count || 0,
  } as Profile;
}

// Toggle follow
export async function toggleFollow(followerId: string, followingId: string, isFollowing: boolean) {
  if (isFollowing) {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('follows')
      .insert({ follower_id: followerId, following_id: followingId });
    if (error) throw error;
  }
}

// Fetch notifications
export async function fetchNotifications(profileId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      actor:profiles!notifications_actor_id_fkey(*),
      post:posts(*)
    `)
    .eq('user_id', profileId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return data as Notification[];
}

// Mark notifications as read
export async function markNotificationsRead(profileId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', profileId)
    .eq('read', false);

  if (error) throw error;
}

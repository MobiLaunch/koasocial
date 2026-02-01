import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  instance: string;
  is_verified?: boolean;
  verification_tier?: string | null;
  social_links?: Record<string, string>;
  created_at: string;
  updated_at: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  is_following?: boolean;
}

export interface Post {
  id: string;
  author_id: string;
  content: string;
  visibility: 'public' | 'unlisted' | 'followers' | 'direct';
  reply_to_id: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  author?: Profile;
  replies_count?: number;
  boosts_count?: number;
  favorites_count?: number;
  is_boosted?: boolean;
  is_favorited?: boolean;
  boosted_by?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'follow' | 'favorite' | 'boost' | 'reply' | 'mention';
  actor_id: string;
  post_id: string | null;
  read: boolean;
  created_at: string;
  actor?: Profile;
  post?: Post;
}

// Fetch posts with author info and counts
export async function fetchPosts(options?: { authorId?: string; visibility?: string }): Promise<Post[]> {
  let query = supabase
    .from('posts')
    .select(`
      *,
      author:profiles!posts_author_id_fkey(*)
    `)
    .order('created_at', { ascending: false });

  if (options?.authorId) {
    query = query.eq('author_id', options.authorId);
  }

  if (options?.visibility) {
    query = query.eq('visibility', options.visibility);
  }

  const { data: posts, error } = await query;

  if (error) {
    console.error('Error fetching posts:', error);
    return [];
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

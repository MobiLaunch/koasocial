import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  created_at: string;
  // Added back for UI compatibility
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
}

export interface Post {
  id: string;
  author_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author?: Profile;
  // Added back for UI compatibility
  favorites_count?: number;
  boosts_count?: number;
  replies_count?: number;
  is_favorited?: boolean;
  is_boosted?: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  type: "follow" | "favorite" | "boost" | "reply" | "mention";
  actor_id: string;
  post_id: string | null;
  read: boolean;
  created_at: string;
  actor?: Profile;
  post?: Post;
}

// 1. Fetch Centralized Profile with Counts
export async function fetchProfile(username: string): Promise<Profile | null> {
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("username", username).single();

  if (error) {
    console.error("Error fetching profile:", error.message);
    return null;
  }

  // Fetch counts separately to keep logic simple
  const [followers, following, posts] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profile.id),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profile.id),
    supabase.from("posts").select("*", { count: "exact", head: true }).eq("author_id", profile.id),
  ]);

  return {
    ...profile,
    followers_count: followers.count || 0,
    following_count: following.count || 0,
    posts_count: posts.count || 0,
  } as Profile;
}

// 2. Fetch Posts (Restored missing interaction helpers)
export async function fetchPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(`*, author:profiles(*)`)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data as Post[];
}

// 3. Create Post (Restored for ComposeModal)
export async function createPost(authorId: string, content: string, imageUrl?: string | null) {
  const { data, error } = await supabase
    .from("posts")
    .insert({ author_id: authorId, content, image_url: imageUrl })
    .select("*, author:profiles(*)")
    .single();

  if (error) throw error;
  return data as Post;
}

// 4. Placeholder functions to stop errors (You can link these to tables later)
export async function getUserInteractions(profileId: string, postIds: string[]) {
  return { favoritedPostIds: new Set<string>(), boostedPostIds: new Set<string>() };
}

export async function toggleFavorite(profileId: string, postId: string, active: boolean) {}
export async function toggleBoost(profileId: string, postId: string, active: boolean) {}
export async function fetchNotifications(profileId: string) {
  return [];
}
export async function markNotificationsRead(profileId: string) {}
export async function toggleFollow(followerId: string, followingId: string, isFollowing: boolean) {
  if (isFollowing) {
    await supabase.from("follows").delete().match({ follower_id: followerId, following_id: followingId });
  } else {
    await supabase.from("follows").insert({ follower_id: followerId, following_id: followingId });
  }
}

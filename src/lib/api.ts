import { supabase } from "@/integrations/supabase/client";

// --- 1. Clean Types ---

export type NotificationType = "like" | "boost" | "reply" | "follow" | "mention" | "message";

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio?: string | null;
  banner_url?: string | null;
  is_verified?: boolean | null;
  verification_tier?: string | null;
  created_at?: string;
  interests?: string[] | null;
  social_links?: Record<string, string> | null;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
}

export interface Post {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  visibility: string;
  reply_to_id?: string | null;
  image_url?: string | null;
  author?: Profile;
  replies_count?: number;
  boosts_count?: number;
  favorites_count?: number;
  is_favorited?: boolean;
  is_boosted?: boolean;
  boosted_by?: Profile;
}

export interface Notification {
  id: string;
  type: NotificationType;
  created_at: string;
  is_read: boolean;
  entity_id: string;
  actor: Profile;
  post?: {
    id: string;
    content: string;
  } | null;
}

// --- 2. Post Functions ---

export async function createPost(
  authorId: string,
  content: string,
  visibility: string = "public",
  replyToId?: string,
  imageUrl?: string | null,
) {
  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: authorId,
      content,
      visibility,
      reply_to_id: replyToId || null,
      image_url: imageUrl || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchPosts(options?: {
  authorId?: string;
  visibility?: string;
  limit?: number;
}): Promise<Post[]> {
  let query = supabase
    .from("posts")
    .select(
      `
      *,
      author:profiles!posts_author_id_fkey(*)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(options?.limit || 50);

  if (options?.authorId) {
    query = query.eq("author_id", options.authorId);
  }

  if (options?.visibility) {
    query = query.eq("visibility", options.visibility);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Get counts for each post
  const postsWithCounts = await Promise.all(
    (data || []).map(async (post) => {
      const [repliesRes, boostsRes, favoritesRes] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("reply_to_id", post.id),
        supabase.from("boosts").select("id", { count: "exact", head: true }).eq("post_id", post.id),
        supabase.from("favorites").select("id", { count: "exact", head: true }).eq("post_id", post.id),
      ]);

      return {
        ...post,
        replies_count: repliesRes.count || 0,
        boosts_count: boostsRes.count || 0,
        favorites_count: favoritesRes.count || 0,
      };
    }),
  );

  return postsWithCounts as Post[];
}

// --- 3. Profile Functions ---

export async function fetchProfile(username: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("username", username).single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }

  // Get follower/following counts
  const [followersRes, followingRes, postsRes] = await Promise.all([
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", data.id),
    supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", data.id),
    supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", data.id),
  ]);

  return {
    ...data,
    followers_count: followersRes.count || 0,
    following_count: followingRes.count || 0,
    posts_count: postsRes.count || 0,
  } as Profile;
}

// --- 4. Interaction Functions ---

export async function getUserInteractions(
  profileId: string,
  postIds: string[],
): Promise<{ favoritedPostIds: Set<string>; boostedPostIds: Set<string> }> {
  const [favoritesRes, boostsRes] = await Promise.all([
    supabase.from("favorites").select("post_id").eq("user_id", profileId).in("post_id", postIds),
    supabase.from("boosts").select("post_id").eq("user_id", profileId).in("post_id", postIds),
  ]);

  return {
    favoritedPostIds: new Set((favoritesRes.data || []).map((f) => f.post_id)),
    boostedPostIds: new Set((boostsRes.data || []).map((b) => b.post_id)),
  };
}

export async function toggleFavorite(profileId: string, postId: string, remove: boolean) {
  if (remove) {
    const { error } = await supabase.from("favorites").delete().eq("user_id", profileId).eq("post_id", postId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("favorites").insert({ user_id: profileId, post_id: postId });
    if (error) throw error;
  }
}

export async function toggleBoost(profileId: string, postId: string, remove: boolean) {
  if (remove) {
    const { error } = await supabase.from("boosts").delete().eq("user_id", profileId).eq("post_id", postId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("boosts").insert({ user_id: profileId, post_id: postId });
    if (error) throw error;
  }
}

export async function toggleFollow(followerId: string, followingId: string, isFollowing: boolean) {
  if (isFollowing) {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("follows").insert({ follower_id: followerId, following_id: followingId });
    if (error) throw error;
  }
}

// --- 5. Notification Functions ---

export async function fetchNotifications(): Promise<Notification[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();

  if (!profile) throw new Error("Profile not found");

  const { data, error } = await supabase
    .from("notifications")
    .select(
      `
      id,
      type,
      created_at,
      is_read,
      entity_id,
      actor:profiles!fk_notifications_actor(id, username, display_name, avatar_url, is_verified, verification_tier),
      post:posts!fk_notifications_post(id, content)
    `,
    )
    .eq("recipient_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }

  return data as unknown as Notification[];
}

export async function markNotificationAsRead(notificationId: string) {
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId);

  if (error) throw error;
}

export async function markAllNotificationsAsRead(profileId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_id", profileId)
    .eq("is_read", false);

  if (error) throw error;
}

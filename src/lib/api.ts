import { supabase } from "@/integrations/supabase/client";

// --- 1. Clean Types (No Circular Dependencies) ---

export type NotificationType = "like" | "boost" | "reply" | "follow";

// A flat, simple interface for the UI
export interface Notification {
  id: string;
  type: NotificationType;
  created_at: string;
  is_read: boolean;
  // The person who triggered the notification
  actor: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  // The post involved (optional, e.g., follows don't have posts)
  post?: {
    id: string;
    content: string;
  } | null;
}

// --- 2. The Fetcher ---

export async function fetchNotifications(): Promise<Notification[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get current user's profile ID first
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  // Fetch notifications for this profile
  const { data, error } = await supabase
    .from("notifications")
    .select(`
      id,
      type,
      created_at,
      is_read,
      actor:profiles!fk_notifications_actor(id, username, display_name, avatar_url),
      post:posts!fk_notifications_post(id, content)
    `)
    .eq("recipient_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }

  // Cast the response to our clean interface to satisfy TypeScript
  return data as unknown as Notification[];
}

// --- 3. The Actions ---

export async function markNotificationAsRead(notificationId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);
    
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

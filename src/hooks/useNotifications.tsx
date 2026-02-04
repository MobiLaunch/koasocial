import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchNotifications, markAllNotificationsAsRead, markNotificationAsRead, Notification } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useNotifications() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // 1. Fetching Logic
  const { 
    data: notifications = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ["notifications", profile?.id],
    queryFn: fetchNotifications,
    enabled: !!profile?.id, // Only run if we have a profile
    staleTime: 1000 * 60, // Cache for 1 minute
  });

  // 2. Real-time Subscription (Twitter-style updates)
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${profile.id}`,
        },
        () => {
          toast("New notification received");
          queryClient.invalidateQueries({ queryKey: ["notifications", profile.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, queryClient]);

  // 3. Mark All Read Logic
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) return;
      await markAllNotificationsAsRead(profile.id);
    },
    onSuccess: () => {
      // Optimistically update the UI
      queryClient.setQueryData(["notifications", profile?.id], (old: Notification[] | undefined) => {
        return old ? old.map(n => ({ ...n, is_read: true })) : [];
      });
    },
    onError: () => {
      toast.error("Failed to mark notifications as read");
    }
  });

  // 4. Computed Values
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    loading: isLoading,
    error,
    markAllAsRead: markAllReadMutation.mutateAsync,
    refresh: refetch
  };
}

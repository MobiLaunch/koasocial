import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Notification } from '@/lib/api';

export function useNotifications() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch initial notifications
  useEffect(() => {
    if (!profile) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const fetchNotifications = async () => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        actor:profiles!notifications_actor_id_fkey(*),
        post:posts(*)
      `)
      .eq('recipient_id', profile.id) // CHANGE: user_id -> recipient_id
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    // Map data to include the virtual 'read' property for the UI
    const formattedData = (data || []).map(n => ({
      ...n,
      read: n.is_read // Map DB column to UI property
    }));

    setNotifications(formattedData);
    setUnreadCount(formattedData.filter(n => !n.read).length);
  } catch (error) {
    console.error('Error fetching notifications:', error);
  } finally {
    setLoading(false);
  }
};

    fetchNotifications();
  }, [profile]);

  // Set up real-time subscription
  useEffect(() => {
    if (!profile) return;

    console.log('Setting up real-time notifications for user:', profile.id);

    const channel = supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT', 
    schema: 'public', 
    table: 'notifications', 
    filter: `recipient_id=eq.${profile.id}`, // CHANGE: user_id -> recipient_id
  }, async (payload) => {
    // ... your fetch logic for the new notification ...
  })
  .on('postgres_changes', {
    event: 'UPDATE', 
    schema: 'public', 
    table: 'notifications', 
    filter: `recipient_id=eq.${profile.id}`, // CHANGE: user_id -> recipient_id
  }, (payload) => {
    // ... your update logic ...
  });
          
          // Fetch the full notification with related data
          const { data, error } = await supabase
            .from('notifications')
            .select(`
              *,
              actor:profiles!notifications_actor_id_fkey(*),
              post:posts(*)
            `)
            .eq('id', payload.new.id)
            .single();

          if (!error && data) {
            setNotifications(prev => [data, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Show browser notification if permission granted
            if ('Notification' in window && Notification.permission === 'granted') {
              const actor = data.actor as any;
              const notificationText = getNotificationText(data.type);
              
              new Notification('New notification on Loveable', {
                body: `${actor?.display_name || 'Someone'} ${notificationText}`,
                icon: actor?.avatar_url || '/favicon.ico',
                tag: data.id,
                badge: '/favicon.ico',
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          console.log('Notification updated:', payload);
          
          setNotifications(prev =>
            prev.map(n => (n.id === payload.new.id ? { ...n, ...payload.new } : n))
          );
          
          // Update unread count
          if (payload.new.read && !payload.old.read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          } else if (!payload.new.read && payload.old.read) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe((status) => {
        console.log('Notification subscription status:', status);
      });

    return () => {
      console.log('Cleaning up notification subscription');
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      // Optimistically update local state
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

const markAllAsRead = async () => {
  if (!profile) return;
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true }) // CHANGE: read -> is_read
      .eq('recipient_id', profile.id) // CHANGE: user_id -> recipient_id
      .eq('is_read', false); // CHANGE: read -> is_read

    if (error) throw error;
    
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
};

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      // Wait a bit before requesting to not overwhelm the user
      const timer = setTimeout(() => {
        Notification.requestPermission().then(permission => {
          console.log('Notification permission:', permission);
        });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  };
}

function getNotificationText(type: string): string {
  const texts: Record<string, string> = {
    follow: 'followed you',
    favorite: 'favorited your post',
    boost: 'boosted your post',
    reply: 'replied to your post',
    mention: 'mentioned you',
  };
  return texts[type] || 'interacted with you';
}

import { useState, useEffect } from 'react';
import { Bell, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationItem } from '@/components/NotificationItem';
import { useAuth } from '@/contexts/AuthContext';
import { fetchNotifications, markNotificationsRead, type Notification } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function NotificationsPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      const data = await fetchNotifications(profile.id);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [profile]);

  const handleMarkAllRead = async () => {
    if (!profile) return;

    try {
      await markNotificationsRead(profile.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast({ title: 'Done!', description: 'All notifications marked as read.' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="animate-fade-in">
      {/* Header - hidden on mobile since we have MobileHeader */}
      <header className="hidden lg:flex sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-primary" />
            <h1 className="font-display text-xl font-bold text-foreground">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                {unreadCount} new
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="gap-2" onClick={handleMarkAllRead}>
              <Check className="h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>
      </header>

      {/* Notifications list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : notifications.length > 0 ? (
        <div className="divide-y divide-border">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
            />
          ))}
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No notifications yet</p>
          <p className="text-sm mt-1">When people interact with you, you'll see it here</p>
        </div>
      )}
    </div>
  );
}

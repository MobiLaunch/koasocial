import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationItem } from '@/components/NotificationItem';
import { mockNotifications } from '@/data/mockData';

export default function NotificationsPage() {
  const unreadCount = mockNotifications.filter(n => !n.read).length;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 lg:top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3">
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

          <Button variant="ghost" size="sm" className="gap-2">
            <Check className="h-4 w-4" />
            Mark all read
          </Button>
        </div>
      </header>

      {/* Notifications list */}
      <div className="divide-y divide-border">
        {mockNotifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
          />
        ))}
      </div>

      {/* Empty state */}
      {mockNotifications.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No notifications yet</p>
        </div>
      )}
    </div>
  );
}

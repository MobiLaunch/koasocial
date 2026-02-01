import { Heart, Repeat2, MessageCircle, UserPlus, AtSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/formatters';
import type { Notification } from '@/data/mockData';

interface NotificationItemProps {
  notification: Notification;
}

const notificationConfig = {
  follow: {
    icon: UserPlus,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    getText: (user: string) => `${user} followed you`,
  },
  favorite: {
    icon: Heart,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    getText: (user: string) => `${user} favorited your post`,
  },
  boost: {
    icon: Repeat2,
    color: 'text-koa-boost',
    bgColor: 'bg-koa-boost/10',
    getText: (user: string) => `${user} boosted your post`,
  },
  reply: {
    icon: MessageCircle,
    color: 'text-koa-success',
    bgColor: 'bg-koa-success/10',
    getText: (user: string) => `${user} replied to your post`,
  },
  mention: {
    icon: AtSign,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    getText: (user: string) => `${user} mentioned you`,
  },
};

export function NotificationItem({ notification }: NotificationItemProps) {
  const config = notificationConfig[notification.type];
  const Icon = config.icon;

  return (
    <Card
      className={cn(
        "p-4 border-0 border-b rounded-none last:border-b-0 transition-colors",
        !notification.read && "bg-accent/50"
      )}
    >
      <div className="flex gap-3">
        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", config.bgColor)}>
          <Icon className={cn("h-5 w-5", config.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3">
            <Link to={`/user/${notification.user.username}`}>
              <Avatar className="h-10 w-10 ring-2 ring-background">
                <AvatarImage src={notification.user.avatar} alt={notification.user.displayName} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {notification.user.displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </Link>

            <div className="flex-1 min-w-0">
              <p className="text-foreground">
                <Link
                  to={`/user/${notification.user.username}`}
                  className="font-semibold hover:underline"
                >
                  {notification.user.displayName}
                </Link>
                {' '}
                {config.getText('').replace(/^.+ /, '')}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {formatRelativeTime(notification.createdAt)}
              </p>

              {notification.post && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {notification.post.content}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

import { Heart, Repeat2, MessageCircle, UserPlus, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/formatters";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import type { Notification, Profile } from "@/lib/api";

interface NotificationItemProps {
  notification: Notification;
}

const notificationConfig = {
  follow: {
    icon: UserPlus,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    getText: () => "followed you",
    getLink: (username: string) => `/profile/${username}`,
  },
  like: {
    icon: Heart,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    getText: () => "liked your post",
    getLink: (username: string, entityId: string) => `/post/${entityId}`,
  },
  boost: {
    icon: Repeat2,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    getText: () => "boosted your post",
    getLink: (username: string, entityId: string) => `/post/${entityId}`,
  },
  message: {
    icon: MessageCircle,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    getText: () => "sent you a message",
    getLink: () => `/messages`,
  },
};

export function NotificationItem({ notification }: NotificationItemProps) {
  // Use a fallback config if the type is unknown to prevent crashes
  const config = notificationConfig[notification.type as keyof typeof notificationConfig] || {
    icon: Bell,
    color: "text-muted-foreground",
    bgColor: "bg-muted/10",
    getText: () => "interacted with you",
    getLink: () => "#",
  };

  const Icon = config.icon;
  const actor = notification.actor as Profile | undefined;

  if (!actor) return null;

  const itemLink = config.getLink(actor.username, notification.entity_id);

  return (
    <Link to={itemLink}>
      <Card
        className={cn(
          "p-4 border-0 border-b rounded-none last:border-b-0 transition-colors hover:bg-accent/30",
          !notification.read && "bg-accent/50",
        )}
      >
        <div className="flex gap-3">
          <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", config.bgColor)}>
            <Icon className={cn("h-5 w-5", config.color)} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-background shrink-0">
                <AvatarImage src={actor.avatar_url || undefined} alt={actor.display_name} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {actor.display_name?.charAt(0) || actor.username.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="text-foreground text-sm sm:text-base">
                  <span className="font-semibold">{actor.display_name || actor.username}</span>
                  {actor.is_verified && (
                    <VerifiedBadge tier={actor.verification_tier} size="sm" className="inline ml-1" />
                  )}{" "}
                  <span className="text-muted-foreground">{config.getText()}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(notification.created_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

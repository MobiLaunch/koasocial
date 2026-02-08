import { useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { Heart, MessageCircle, Repeat, UserPlus, Check, Bell, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

export default function NotificationsPage() {
  const { notifications, loading, markAllAsRead, unreadCount } = useNotifications();
  const navigate = useNavigate();

  // Icons mapping with M3 Expressive colors
  const getIcon = (type: string) => {
    switch (type) {
      case "like": 
        return (
          <div className="h-10 w-10 rounded-xl bg-pink-500/15 flex items-center justify-center">
            <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
          </div>
        );
      case "boost": 
        return (
          <div className="h-10 w-10 rounded-xl bg-koa-boost/15 flex items-center justify-center">
            <Repeat className="w-5 h-5 text-koa-boost" />
          </div>
        );
      case "follow": 
        return (
          <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-primary" />
          </div>
        );
      case "message":
        return (
          <div className="h-10 w-10 rounded-xl bg-secondary/15 flex items-center justify-center">
            <Mail className="w-5 h-5 text-secondary" />
          </div>
        );
      default: 
        return (
          <div className="h-10 w-10 rounded-xl bg-accent/30 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-accent-foreground" />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/50">
          <LoadingIndicator size="sm" className="absolute top-0 left-0 right-0" />
          <div className="px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-headline-medium text-foreground">Notifications</h1>
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse">
            <Bell className="h-5 w-5 text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header - M3 Expressive style */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="px-5 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-headline-medium text-foreground">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => markAllAsRead()}
              className="rounded-xl gap-2 text-primary hover:bg-primary/10"
            >
              <Check className="w-4 h-4" /> Mark all read
            </Button>
          )}
        </div>
      </header>

      {/* Notifications list */}
      <div className="divide-y divide-border/50">
        {notifications.length === 0 ? (
          <div className="p-16 text-center">
            <div className="h-20 w-20 rounded-3xl bg-surface-container-high flex items-center justify-center mx-auto mb-6">
              <Bell className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-foreground mb-2">No notifications yet</p>
            <p className="text-muted-foreground">When someone interacts with you, it'll show up here.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`p-5 border-0 rounded-none hover:bg-surface-container transition-all duration-200 cursor-pointer ${
                !notification.is_read ? "bg-primary/5" : "bg-transparent"
              }`}
              onClick={() => {
                // Navigate based on type
                if (notification.post) {
                  navigate(`/post/${notification.post.id}`);
                } else {
                  navigate(`/u/${notification.actor.username}`);
                }
              }}
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0">{getIcon(notification.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar className="w-9 h-9 ring-2 ring-background shadow-sm">
                      <AvatarImage src={notification.actor.avatar_url || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {notification.actor.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <span 
                        className="font-semibold text-foreground hover:text-primary transition-colors cursor-pointer" 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/u/${notification.actor.username}`);
                        }}
                      >
                        {notification.actor.display_name}
                      </span>
                      <span className="text-muted-foreground text-sm ml-2">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-foreground font-medium">
                    {notification.type === "like" && "liked your post"}
                    {notification.type === "boost" && "boosted your post"}
                    {notification.type === "follow" && "followed you"}
                    {notification.type === "reply" && "replied to your post"}
                  </p>

                  {notification.post && (
                    <div className="mt-3 text-muted-foreground text-sm line-clamp-2 border-l-3 border-border pl-4 py-1 rounded-r-lg bg-surface-container">
                      {notification.post.content}
                    </div>
                  )}
                </div>
                
                {!notification.is_read && (
                  <div className="flex-shrink-0">
                    <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
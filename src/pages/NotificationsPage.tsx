import { useEffect } from "react";
import { useNotifications } from "@/hooks/useNotifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Repeat, UserPlus, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

export default function NotificationsPage() {
  const { notifications, loading, markAllAsRead, unreadCount } = useNotifications();
  const navigate = useNavigate();

  // Icons mapping
  const getIcon = (type: string) => {
    switch (type) {
      case "like": return <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />;
      case "boost": return <Repeat className="w-5 h-5 text-green-500" />;
      case "follow": return <UserPlus className="w-5 h-5 text-blue-500" />;
      default: return <MessageCircle className="w-5 h-5 text-sky-500" />;
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading notifications...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto min-h-screen border-x border-gray-800">
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md p-4 border-b border-gray-800 flex justify-between items-center">
        <h1 className="text-xl font-bold">Notifications</h1>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => markAllAsRead()}>
            <Check className="w-4 h-4 mr-2" /> Mark all read
          </Button>
        )}
      </div>

      <div className="divide-y divide-gray-800">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No notifications yet.
          </div>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`p-4 border-0 rounded-none hover:bg-white/5 transition-colors cursor-pointer ${
                !notification.is_read ? "bg-blue-500/5" : "bg-transparent"
              }`}
              onClick={() => {
                // Navigate based on type
                if (notification.post) {
                  navigate(`/post/${notification.post.id}`);
                } else {
                  navigate(`/@${notification.actor.username}`);
                }
              }}
            >
              <div className="flex gap-4">
                <div className="mt-1">{getIcon(notification.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={notification.actor.avatar_url || ""} />
                      <AvatarFallback>{notification.actor.username[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-bold text-sm hover:underline" onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/@${notification.actor.username}`);
                    }}>
                      {notification.actor.display_name}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {formatDistanceToNow(new Date(notification.created_at))} ago
                    </span>
                  </div>
                  
                  <p className="text-gray-300 text-sm">
                    {notification.type === "like" && "liked your post"}
                    {notification.type === "boost" && "boosted your post"}
                    {notification.type === "follow" && "followed you"}
                    {notification.type === "reply" && "replied to your post"}
                  </p>

                  {notification.post && (
                    <div className="mt-2 text-gray-500 text-sm line-clamp-1 border-l-2 border-gray-700 pl-3">
                      {notification.post.content}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Globe, Bell, User, Feather, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

interface MobileBottomNavProps {
  onCompose: () => void;
}

const navItems = [
  { icon: Home, label: 'Home', path: '/home' },
  { icon: Search, label: 'Search', path: '/search' },
  { icon: MessageCircle, label: 'Messages', path: '/messages', badge: 'messages' },
  { icon: Bell, label: 'Alerts', path: '/notifications', badge: 'notifications' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function MobileBottomNav({ onCompose }: MobileBottomNavProps) {
  const location = useLocation();
  const { profile } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (profile) {
      // Fetch unread notifications
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('read', false)
        .then(({ count }) => setUnreadNotifications(count || 0));

      // Fetch unread messages
      const fetchUnreadMessages = async () => {
        const { data: participantData } = await supabase
          .from('conversation_participants')
          .select('conversation_id, last_read_at')
          .eq('profile_id', profile.id);

        if (participantData?.length) {
          let totalUnread = 0;
          for (const p of participantData) {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', p.conversation_id)
              .neq('sender_id', profile.id)
              .gt('created_at', p.last_read_at || '1970-01-01');
            totalUnread += count || 0;
          }
          setUnreadMessages(totalUnread);
        }
      };
      fetchUnreadMessages();
    }
  }, [profile]);

  return (
    <>
      {/* Floating compose button - positioned above the nav */}
      <button
        onClick={onCompose}
        className="lg:hidden fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full koa-gradient text-primary-foreground shadow-lg koa-shadow flex items-center justify-center transition-transform duration-200 active:scale-95 hover:scale-105 safe-area-bottom-offset"
        aria-label="Compose"
      >
        <Feather className="h-6 w-6" />
      </button>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-xl transition-all duration-200",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  <item.icon className={cn(
                    "h-6 w-6 transition-transform duration-200",
                    isActive && "scale-110"
                  )} />
                  {item.badge === 'notifications' && unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                  {item.badge === 'messages' && unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive && "font-semibold"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

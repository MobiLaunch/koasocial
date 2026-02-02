import { Link, useLocation } from 'react-router-dom';
import { Home, Search, MessageCircle, Bell, User, Feather } from 'lucide-react';
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
  { icon: MessageCircle, label: 'Messages', path: '/messages' },
  { icon: Bell, label: 'Alerts', path: '/notifications', badge: true },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function MobileBottomNav({ onCompose }: MobileBottomNavProps) {
  const location = useLocation();
  const { profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (profile) {
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('read', false)
        .then(({ count }) => setUnreadCount(count || 0));
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
                  {item.badge && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
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

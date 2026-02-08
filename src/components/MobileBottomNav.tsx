import { Link, useLocation } from 'react-router-dom';
import { Home, Search, MessageCircle, Bell, User, Feather } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { FAB } from '@/components/ui/fab';

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
  const { unreadCount } = useNotifications();

  return (
    <>
      {/* Floating Action Button - M3 Expressive style */}
      <FAB
        onClick={onCompose}
        variant="primary"
        size="md"
        className="lg:hidden fixed bottom-24 right-5 z-50 animate-fab-enter koa-shadow-lg"
        aria-label="Compose"
      >
        <Feather className="h-6 w-6" />
      </FAB>

      {/* Bottom Navigation Bar - M3 style */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-container/95 backdrop-blur-xl border-t border-border/50 safe-area-bottom">
        <div className="flex items-center justify-around h-20 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 flex-1 py-3 rounded-2xl transition-all duration-300",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className={cn(
                  "relative flex items-center justify-center w-16 h-8 rounded-full transition-all duration-300",
                  isActive && "bg-primary/15"
                )}>
                  <item.icon className={cn(
                    "h-6 w-6 transition-all duration-300",
                    isActive && "scale-105"
                  )} />
                  {item.badge && unreadCount > 0 && (
                    <span className="absolute -top-0.5 right-2 h-5 min-w-5 px-1.5 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center shadow-sm">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "text-[11px] font-medium transition-all duration-200",
                  isActive && "font-bold"
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
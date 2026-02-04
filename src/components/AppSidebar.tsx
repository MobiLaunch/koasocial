import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Globe, Bell, Search, User, Feather, Settings, Moon, Sun, Menu, X, LogOut, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { Logo } from '@/components/Logo';

interface AppSidebarProps {
  onCompose: () => void;
}

const navItems = [
  { icon: Home, label: 'Home', path: '/home' },
  { icon: Search, label: 'Search', path: '/search' },
  { icon: Globe, label: 'Public', path: '/public' },
  { icon: MessageCircle, label: 'Messages', path: '/messages' },
  { icon: Bell, label: 'Notifications', path: '/notifications', badge: true },
  { icon: User, label: 'Profile', path: '/profile' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function AppSidebar({ onCompose }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const [isDark, setIsDark] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="px-4 py-3 mb-4">
        <Logo size="md" linkTo="/home" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-xl mb-1 transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-foreground hover:bg-accent"
              )}
            >
              <div className="relative">
                <item.icon className="h-6 w-6" />
                {item.badge && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-lg">{item.label}</span>
            </Link>
          );
        })}

        {/* Compose button */}
        <Button
          onClick={() => {
            onCompose();
            setIsMobileOpen(false);
          }}
          className="w-full mt-4 h-12 rounded-xl text-lg font-semibold koa-gradient text-primary-foreground hover:opacity-90 koa-shadow"
        >
          <Feather className="h-5 w-5 mr-2" />
          Compose
        </Button>
      </nav>

      {/* Footer */}
      <div className="px-2 pb-4 mt-auto">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-4 px-4 py-3 rounded-xl mb-2 text-foreground hover:bg-accent"
          onClick={toggleTheme}
        >
          {isDark ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
          <span className="text-lg">{isDark ? 'Light mode' : 'Dark mode'}</span>
        </Button>

        {/* Sign out */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-4 px-4 py-3 rounded-xl mb-2 text-foreground hover:bg-accent"
          onClick={handleSignOut}
        >
          <LogOut className="h-6 w-6" />
          <span className="text-lg">Sign out</span>
        </Button>

        {/* User profile quick access */}
        {profile && (
          <Link
            to="/profile"
            onClick={() => setIsMobileOpen(false)}
            className="flex items-center gap-3 px-4 py-3 mt-2 rounded-xl hover:bg-accent transition-colors"
          >
            <Avatar className="h-10 w-10 ring-2 ring-background">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {profile.display_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground truncate">{profile.display_name}</div>
              <div className="text-sm text-muted-foreground truncate">@{profile.username}</div>
            </div>
          </Link>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar only - mobile uses MobileBottomNav */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-72 bg-sidebar border-r flex-col">
        <NavContent />
      </aside>
    </>
  );
}


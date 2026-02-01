import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Globe, Bell, User, Feather, Settings, Moon, Sun, Menu, X, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface AppSidebarProps {
  onCompose: () => void;
}

const navItems = [
  { icon: Home, label: 'Home', path: '/home' },
  { icon: Globe, label: 'Public', path: '/public' },
  { icon: Bell, label: 'Notifications', path: '/notifications', badge: true },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function AppSidebar({ onCompose }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [isDark, setIsDark] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (profile) {
      // Fetch unread notification count
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('read', false)
        .then(({ count }) => setUnreadCount(count || 0));
    }
  }, [profile]);

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
      <Link to="/home" className="flex items-center gap-3 px-4 py-3 mb-4">
        <div className="h-10 w-10 rounded-2xl koa-gradient flex items-center justify-center">
          <span className="text-xl">🐨</span>
        </div>
        <span className="font-display text-2xl font-bold text-foreground">koasocial</span>
      </Link>

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
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur border-b">
        <Link to="/home" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl koa-gradient flex items-center justify-center">
            <span className="text-lg">🐨</span>
          </div>
          <span className="font-display text-xl font-bold">koasocial</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed top-14 left-0 bottom-0 z-40 w-72 bg-sidebar border-r transform transition-transform duration-300 flex flex-col",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <NavContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-72 bg-sidebar border-r flex-col">
        <NavContent />
      </aside>
    </>
  );
}

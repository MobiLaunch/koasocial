import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, LogOut, Moon, Sun, Settings, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function MobileHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const [isDark, setIsDark] = useState(false);

  // Pages that should show a back button instead of menu
  const detailPages = ['/profile/edit', '/settings'];
  const isDetailPage = detailPages.some(path => location.pathname.startsWith(path)) || 
    location.pathname.match(/^\/@[^/]+$/);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b safe-area-top">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left: Back button or Menu/Profile */}
        {isDetailPage ? (
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                {profile ? (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {profile.display_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {profile && (
                <>
                  <div className="px-2 py-2">
                    <p className="font-semibold truncate">{profile.display_name}</p>
                    <p className="text-sm text-muted-foreground truncate">@{profile.username}</p>
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleTheme}>
                {isDark ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                {isDark ? 'Light mode' : 'Dark mode'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Center: Logo */}
        <Logo size="md" linkTo="/home" />

        {/* Right: Placeholder for balance */}
        <div className="w-9" />
      </div>
    </header>
  );
}

import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Globe,
  Bell,
  Search,
  User,
  Feather,
  Settings,
  Moon,
  Sun,
  LogOut,
  MessageCircle,
  MoreHorizontal
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { Logo } from "@/components/Logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppSidebarProps {
  onCompose: () => void;
}

const navItems = [
  { icon: Home, label: "Home", path: "/home" },
  { icon: Search, label: "Search", path: "/search" },
  { icon: Globe, label: "Public", path: "/public" },
  { icon: MessageCircle, label: "Messages", path: "/messages", badge: true },
  { icon: Bell, label: "Notifications", path: "/notifications", badge: true },
  { icon: User, label: "Profile", path: "/profile" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function AppSidebar({ onCompose }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[18rem] bg-background/95 backdrop-blur-xl border-r border-border/40 flex-col z-50">
      {/* 1. Header & Logo */}
      <div className="px-6 py-8 flex items-center justify-between">
        <Logo size="md" linkTo="/home" />
      </div>

      {/* 2. Primary Action (Extended FAB) 
          Moved to top as per M3 standards for high prominence */}
      <div className="px-4 mb-8">
        <Button
          onClick={onCompose}
          className="w-full h-14 rounded-[1.2rem] shadow-lg shadow-primary/20 hover:shadow-primary/30 text-lg font-medium transition-all duration-300 hover:scale-[1.02] bg-primary text-primary-foreground group"
        >
          <Feather className="h-6 w-6 mr-3 transition-transform group-hover:rotate-12" />
          Compose
        </Button>
      </div>

      {/* 3. Navigation Drawer */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "relative flex items-center gap-4 px-5 py-4 rounded-full transition-all duration-300 group overflow-hidden",
                isActive
                  ? "bg-secondary/60 text-foreground font-bold"
                  : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground"
              )}
            >
              {/* Active Indicator Splash (Optional visual flair) */}
              {isActive && (
                <div className="absolute inset-0 bg-primary/10 rounded-full animate-in fade-in zoom-in-95 duration-200" />
              )}
              
              <div className="relative z-10 flex items-center gap-4 w-full">
                <item.icon
                  strokeWidth={isActive ? 2.8 : 2}
                  className={cn(
                    "h-[1.6rem] w-[1.6rem] transition-all duration-300",
                    isActive ? "text-primary scale-110" : "group-hover:text-foreground"
                  )}
                />
                <span className="text-[1.05rem] tracking-wide">{item.label}</span>
                
                {/* M3 Style Badge */}
                {item.badge && unreadCount > 0 && (
                  <span className="ml-auto flex h-6 min-w-6 px-1.5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-sm">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* 4. Bottom Actions / Profile Card */}
      <div className="p-4 mt-auto">
        <div className="rounded-[1.5rem] bg-secondary/30 p-2 border border-border/50">
          
          {/* User Row */}
          {profile && (
            <Link
              to="/profile"
              className="flex items-center gap-3 p-2 rounded-2xl hover:bg-background/80 transition-colors group mb-1"
            >
              <Avatar className="h-10 w-10 ring-2 ring-background transition-transform group-hover:scale-105">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
                <AvatarFallback className="bg-primary/20 text-primary font-bold">
                  {profile.display_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <span className="font-bold text-sm text-foreground truncate leading-none mb-1">
                  {profile.display_name}
                </span>
                <span className="text-xs text-muted-foreground truncate leading-none">
                  @{profile.username}
                </span>
              </div>
            </Link>
          )}

          {/* Quick Settings Grid */}
          <div className="grid grid-cols-2 gap-1 mt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-10 rounded-xl hover:bg-background/80 text-muted-foreground hover:text-foreground"
            >
              {isDark ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
              <span className="text-xs font-medium">{isDark ? "Light" : "Dark"}</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 rounded-xl hover:bg-background/80 text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="h-4 w-4 mr-2" />
                  <span className="text-xs font-medium">More</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl p-2">
                <DropdownMenuItem onClick={handleSignOut} className="rounded-lg text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </aside>
  );
}

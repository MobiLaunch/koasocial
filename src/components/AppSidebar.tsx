import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Globe, Bell, Search, User, Feather, Settings, Moon, Sun, LogOut, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { Logo } from "@/components/Logo";

interface AppSidebarProps {
  onCompose: () => void;
}

const navItems = [
  { icon: Home, label: "Home", path: "/home" },
  { icon: Search, label: "Search", path: "/search" },
  { icon: Globe, label: "Public", path: "/public" },
  // Fixed: Added badge: true correctly here
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
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-72 bg-sidebar border-r border-border/50 flex-col">
      {/* Logo */}
      <div className="px-5 py-5 mb-2">
        <Logo size="md" linkTo="/home" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-2xl mb-1 transition-all duration-300 group",
                isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-foreground hover:bg-surface-container-high",
              )}
            >
              <div className="relative">
                <item.icon
                  className={cn("h-6 w-6 transition-transform duration-200", !isActive && "group-hover:scale-110")}
                />
                {/* Notification Badge Logic */}
                {item.badge && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center shadow-sm">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-lg">{item.label}</span>
            </Link>
          );
        })}

        {/* Compose button - M3 Extended FAB style */}
        <Button
          onClick={onCompose}
          size="lg"
          className="w-full mt-6 h-14 rounded-2xl text-base font-semibold koa-gradient text-primary-foreground koa-shadow-lg hover:koa-shadow-xl transition-all duration-300 hover:-translate-y-0.5"
        >
          <Feather className="h-5 w-5 mr-2" />
          Compose
        </Button>
      </nav>

      {/* Footer */}
      <div className="px-3 pb-5 mt-auto space-y-1">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-4 px-4 py-3.5 rounded-2xl text-foreground hover:bg-surface-container-high"
          onClick={toggleTheme}
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span>{isDark ? "Light mode" : "Dark mode"}</span>
        </Button>

        {/* Sign out */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-4 px-4 py-3.5 rounded-2xl text-foreground hover:bg-surface-container-high"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5" />
          <span>Sign out</span>
        </Button>

        {/* User profile quick access */}
        {profile && (
          <Link
            to="/profile"
            className="flex items-center gap-3 px-4 py-3 mt-3 rounded-2xl hover:bg-surface-container-high transition-all duration-200 group"
          >
            <Avatar className="h-11 w-11 ring-2 ring-background shadow-sm">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
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
    </aside>
  );
}

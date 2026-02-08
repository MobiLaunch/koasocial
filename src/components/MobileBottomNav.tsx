import { Link, useLocation } from "react-router-dom";
import { Home, Search, MessageCircle, Bell, User, Feather, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { FAB } from "@/components/ui/fab";

interface MobileBottomNavProps {
  onCompose: () => void;
}

const navItems = [
  { icon: Home, label: "Home", path: "/home" },
  { icon: Search, label: "Search", path: "/search" },
  { icon: MessageCircle, label: "Messages", path: "/messages", badge: true },
  { icon: Bell, label: "Alerts", path: "/notifications", badge: true },
  { icon: User, label: "Profile", path: "/profile" },
];

export function MobileBottomNav({ onCompose }: MobileBottomNavProps) {
  const location = useLocation();
  const { unreadCount } = useNotifications();

  return (
    <>
      {/* 1. M3 Floating Action Button 
        - Changed shape to 'rounded-[1.2rem]' (Squircle/Super-ellipse)
        - Added shadow-primary/25 for colored glow
      */}
      <div className="lg:hidden fixed bottom-24 right-5 z-50">
        <FAB
          onClick={onCompose}
          className="h-14 w-14 rounded-[1.2rem] bg-primary text-primary-foreground shadow-xl shadow-primary/25 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center"
          aria-label="Compose"
        >
          <Feather className="h-6 w-6" strokeWidth={2.5} />
        </FAB>
      </div>

      {/* 2. M3 Bottom Navigation Bar 
        - Taller height (h-[88px]) for better touch targets
        - distinct 'pill' shape for active state
      */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-t border-border/30 pb-safe-area-bottom">
        <div className="flex items-center justify-around h-[5.5rem] px-2 pb-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className="group flex flex-col items-center justify-center w-full h-full gap-1 pt-2 cursor-pointer active:scale-95 transition-transform duration-100"
              >
                {/* Icon Container & Pill */}
                <div className={cn(
                  "relative flex items-center justify-center w-16 h-8 rounded-full transition-all duration-300 ease-out",
                  isActive 
                    ? "bg-primary/15 w-[4rem]" // Wider active pill
                    : "group-hover:bg-secondary/40"
                )}>
                  {/* Icon */}
                  <item.icon 
                    className={cn(
                      "h-6 w-6 transition-all duration-300",
                      isActive 
                        ? "text-primary stroke-[2.5px] scale-100" // Bold & colored when active
                        : "text-muted-foreground stroke-[1.5px] group-hover:text-foreground"
                    )} 
                  />

                  {/* Notification Badge (Integrated into the pill) */}
                  {item.badge && unreadCount > 0 && (
                    <span className={cn(
                      "absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white shadow-sm ring-2 ring-background transition-transform duration-300",
                      isActive && "scale-110 -translate-y-0.5 translate-x-0.5"
                    )}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span className={cn(
                  "text-[0.7rem] font-medium tracking-wide transition-all duration-300",
                  isActive 
                    ? "text-foreground font-bold translate-y-0 opacity-100" 
                    : "text-muted-foreground/80 translate-y-0.5" 
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

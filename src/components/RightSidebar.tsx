import { UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { suggestedUsers } from '@/data/mockData';
import { TrendingNews } from '@/components/TrendingNews';

export function RightSidebar() {
  return (
    <aside className="hidden xl:block w-80 p-5 space-y-5">
      {/* Trending News */}
      <TrendingNews />

      {/* Suggested to follow - M3 Expressive card */}
      <Card className="rounded-3xl border-0 koa-shadow overflow-hidden">
        <CardHeader className="pb-4 bg-gradient-to-br from-surface-container to-surface-container-high">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="h-9 w-9 rounded-xl bg-secondary/15 flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-secondary" />
            </div>
            Who to follow
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {suggestedUsers.slice(0, 3).map((user) => (
              <div key={user.id} className="flex items-center gap-3 group">
                <Link to={`/u/${user.username}`}>
                  <Avatar className="h-11 w-11 ring-2 ring-background shadow-sm transition-transform group-hover:scale-105">
                    <AvatarImage src={user.avatar} alt={user.displayName} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {user.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/u/${user.username}`}
                    className="font-semibold text-foreground hover:text-primary truncate block transition-colors"
                  >
                    {user.displayName}
                  </Link>
                  <div className="text-sm text-muted-foreground truncate">
                    @{user.username}
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200 font-semibold"
                  variant="ghost"
                >
                  Follow
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer links - M3 style */}
      <div className="text-xs text-muted-foreground px-3 space-y-3">
        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
          <Link to="/about" className="hover:text-foreground transition-colors font-medium">About</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors font-medium">Terms</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors font-medium">Privacy</Link>
          <Link to="/docs" className="hover:text-foreground transition-colors font-medium">Docs</Link>
        </div>
        <div className="text-muted-foreground/70">© 2026 koasocial</div>
      </div>
    </aside>
  );
}
import { TrendingUp, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockTrending, suggestedUsers } from '@/data/mockData';
import { formatCount } from '@/lib/formatters';

export function RightSidebar() {
  return (
    <aside className="hidden xl:block w-80 p-4 space-y-4">
      {/* Trending */}
      <Card className="rounded-2xl koa-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Trending now
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {mockTrending.map((topic) => (
              <Link
                key={topic.tag}
                to={`/tag/${topic.tag.slice(1)}`}
                className="block hover:bg-accent rounded-lg p-2 -mx-2 transition-colors"
              >
                <div className="font-semibold text-foreground">{topic.tag}</div>
                <div className="text-sm text-muted-foreground">
                  {formatCount(topic.posts)} posts
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Suggested to follow */}
      <Card className="rounded-2xl koa-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <UserPlus className="h-5 w-5 text-primary" />
            Who to follow
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {suggestedUsers.slice(0, 3).map((user) => (
              <div key={user.id} className="flex items-center gap-3">
                <Link to={`/user/${user.username}`}>
                  <Avatar className="h-10 w-10 ring-2 ring-background">
                    <AvatarImage src={user.avatar} alt={user.displayName} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/user/${user.username}`}
                    className="font-semibold text-foreground hover:underline truncate block"
                  >
                    {user.displayName}
                  </Link>
                  <div className="text-sm text-muted-foreground truncate">
                    @{user.username}
                  </div>
                </div>
                <Button size="sm" className="rounded-full koa-gradient text-primary-foreground hover:opacity-90">
                  Follow
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer links */}
      <div className="text-xs text-muted-foreground px-2 space-y-2">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          <Link to="/about" className="hover:underline">About</Link>
          <Link to="/terms" className="hover:underline">Terms</Link>
          <Link to="/privacy" className="hover:underline">Privacy</Link>
          <Link to="/docs" className="hover:underline">Docs</Link>
        </div>
        <div>© 2024 koasocial</div>
      </div>
    </aside>
  );
}

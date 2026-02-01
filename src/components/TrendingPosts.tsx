import { useState, useEffect } from 'react';
import { TrendingUp, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface TrendingPost {
  id: string;
  instance: string;
  url: string;
  content: string;
  created_at: string;
  reblogs_count: number;
  favourites_count: number;
  replies_count: number;
  author: {
    username: string;
    acct: string;
    display_name: string;
    avatar: string;
    url: string;
  };
  media: Array<{
    type: string;
    url: string;
    preview_url: string;
  }>;
}

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export function TrendingPosts() {
  const [posts, setPosts] = useState<TrendingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrending = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('fetch-trending');
      
      if (fnError) {
        throw fnError;
      }
      
      if (data?.success && data.posts) {
        setPosts(data.posts);
      } else {
        throw new Error(data?.error || 'Failed to fetch');
      }
    } catch (err) {
      console.error('Error fetching trending:', err);
      setError('Could not load trending posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrending();
  }, []);

  return (
    <Card className="rounded-2xl koa-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 font-display text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Fediverse Trending
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={fetchTrending}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading && posts.length === 0 ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            <p>{error}</p>
            <Button variant="link" size="sm" onClick={fetchTrending}>
              Try again
            </Button>
          </div>
        ) : posts.length === 0 ? (
          <p className="text-center py-4 text-muted-foreground text-sm">
            No trending posts found
          </p>
        ) : (
          <div className="space-y-4">
            {posts.slice(0, 5).map((post) => (
              <a
                key={post.id}
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:bg-accent rounded-lg p-2 -mx-2 transition-colors group"
              >
                <div className="flex items-start gap-2">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={post.author.avatar} alt={post.author.display_name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {post.author.display_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-sm text-foreground truncate max-w-[120px]">
                        {post.author.display_name}
                      </span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {post.instance}
                      </Badge>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      @{post.author.acct}
                    </p>
                    <p className="text-sm text-foreground mt-1 line-clamp-2">
                      {truncate(stripHtml(post.content), 120)}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span>❤️ {post.favourites_count}</span>
                      <span>🔁 {post.reblogs_count}</span>
                      <span>
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

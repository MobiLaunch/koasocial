import { useState, useEffect } from 'react';
import { Hash, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { formatCount } from '@/lib/formatters';

interface TrendingTag {
  name: string;
  url: string;
  instance: string;
  uses_today: number;
  accounts_today: number;
}

export function TrendingTags() {
  const [tags, setTags] = useState<TrendingTag[]>([]);
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
      
      if (data?.success && data.tags) {
        setTags(data.tags);
      } else {
        throw new Error(data?.error || 'Failed to fetch');
      }
    } catch (err) {
      console.error('Error fetching trending tags:', err);
      setError('Could not load trending tags');
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
            <Hash className="h-5 w-5 text-primary" />
            Trending Tags
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
        {loading && tags.length === 0 ? (
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
        ) : tags.length === 0 ? (
          <p className="text-center py-4 text-muted-foreground text-sm">
            No trending tags found
          </p>
        ) : (
          <div className="space-y-2">
            {tags.slice(0, 8).map((tag) => (
              <a
                key={`${tag.instance}:${tag.name}`}
                href={tag.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between hover:bg-accent rounded-lg p-2 -mx-2 transition-colors group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-primary truncate">
                    #{tag.name}
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                    {tag.instance.split('.')[0]}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatCount(tag.uses_today)} posts
                </span>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

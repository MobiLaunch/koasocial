import { Heart, MessageCircle, Repeat2, ExternalLink, Globe } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export interface FederatedPost {
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

interface FederatedPostCardProps {
  post: FederatedPost;
}

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

export function FederatedPostCard({ post }: FederatedPostCardProps) {
  const cleanContent = stripHtml(post.content);

  return (
    <Card className="p-4 hover:bg-accent/30 transition-colors duration-200 border-0 border-b rounded-none last:border-b-0 overflow-hidden">
      {/* Federated indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3 ml-12 overflow-hidden">
        <Globe className="h-4 w-4 text-primary flex-shrink-0" />
        <span className="truncate">From the Fediverse</span>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex-shrink-0">
          {post.instance}
        </Badge>
      </div>

      <div className="flex gap-3">
        {/* Avatar */}
        <a href={post.author.url} target="_blank" rel="noopener noreferrer">
          <Avatar className="h-12 w-12 ring-2 ring-background hover:ring-primary transition-colors">
            <AvatarImage src={post.author.avatar} alt={post.author.display_name} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {post.author.display_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </a>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-baseline gap-x-2 min-w-0">
              <a 
                href={post.author.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-semibold text-foreground truncate hover:underline"
              >
                {post.author.display_name}
              </a>
              <span className="text-sm text-muted-foreground truncate">
                @{post.author.acct}
              </span>
              <span className="text-sm text-muted-foreground">·</span>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </span>
            </div>

            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          {/* Content */}
          <p className="mt-2 text-foreground whitespace-pre-wrap break-words leading-relaxed overflow-hidden [overflow-wrap:anywhere]">
            {cleanContent}
          </p>

          {/* Media attachments */}
          {post.media && post.media.length > 0 && (
            <div className={`mt-3 grid gap-2 ${post.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {post.media.slice(0, 4).map((media, idx) => (
                media.type === 'image' && (
                  <a
                    key={idx}
                    href={media.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-xl"
                  >
                    <img
                      src={media.preview_url || media.url}
                      alt=""
                      className="w-full h-auto max-h-80 object-cover hover:opacity-90 transition-opacity"
                      loading="lazy"
                    />
                  </a>
                )
              ))}
            </div>
          )}

          {/* Action bar - view only, links to original */}
          <div className="flex items-center justify-between mt-4 max-w-md">
            {/* Reply count */}
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">{post.replies_count}</span>
            </a>

            {/* Boost count */}
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-koa-boost transition-colors"
            >
              <Repeat2 className="h-4 w-4" />
              <span className="text-sm">{post.reblogs_count}</span>
            </a>

            {/* Favorite count */}
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Heart className="h-4 w-4" />
              <span className="text-sm">{post.favourites_count}</span>
            </a>

            {/* View on instance */}
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary transition-colors truncate hidden sm:inline"
            >
              View on {post.instance}
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
}

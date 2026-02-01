import { useState } from 'react';
import { Heart, MessageCircle, Repeat2, Share, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatRelativeTime, formatHandle, formatCount } from '@/lib/formatters';
import { toggleFavorite, toggleBoost, type Post, type Profile } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface PostCardProps {
  post: Post;
  onReply?: (post: Post) => void;
  onInteractionChange?: () => void;
}

export function PostCard({ post, onReply, onInteractionChange }: PostCardProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isFavorited, setIsFavorited] = useState(post.is_favorited || false);
  const [isBoosted, setIsBoosted] = useState(post.is_boosted || false);
  const [favoritesCount, setFavoritesCount] = useState(post.favorites_count || 0);
  const [boostsCount, setBoostsCount] = useState(post.boosts_count || 0);
  const [isLoading, setIsLoading] = useState(false);

  const author = post.author as Profile;

  const handleFavorite = async () => {
    if (!profile || isLoading) return;

    setIsLoading(true);
    try {
      await toggleFavorite(profile.id, post.id, isFavorited);
      setIsFavorited(!isFavorited);
      setFavoritesCount(prev => isFavorited ? prev - 1 : prev + 1);
      onInteractionChange?.();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBoost = async () => {
    if (!profile || isLoading) return;

    setIsLoading(true);
    try {
      await toggleBoost(profile.id, post.id, isBoosted);
      setIsBoosted(!isBoosted);
      setBoostsCount(prev => isBoosted ? prev - 1 : prev + 1);
      onInteractionChange?.();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!author) return null;

  return (
    <Card className="p-4 hover:bg-accent/30 transition-colors duration-200 border-0 border-b rounded-none last:border-b-0">
      {/* Boost indicator */}
      {post.boosted_by && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3 ml-12">
          <Repeat2 className="h-4 w-4" />
          <span>{post.boosted_by.display_name} boosted</span>
        </div>
      )}

      <div className="flex gap-3">
        {/* Avatar */}
        <Avatar className="h-12 w-12 ring-2 ring-background">
          <AvatarImage src={author.avatar_url || undefined} alt={author.display_name} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {author.display_name.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-baseline gap-x-2 min-w-0">
              <span className="font-semibold text-foreground truncate">
                {author.display_name}
              </span>
              <span className="text-sm text-muted-foreground truncate">
                {formatHandle(author.username, author.instance)}
              </span>
              <span className="text-sm text-muted-foreground">·</span>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {formatRelativeTime(post.created_at)}
              </span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Copy link</DropdownMenuItem>
                <DropdownMenuItem>Mute user</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Report</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Content */}
          <p className="mt-2 text-foreground whitespace-pre-wrap break-words leading-relaxed">
            {post.content}
          </p>

          {/* Action bar */}
          <div className="flex items-center justify-between mt-4 max-w-md">
            {/* Reply */}
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10"
              onClick={() => onReply?.(post)}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm">{formatCount(post.replies_count || 0)}</span>
            </Button>

            {/* Boost */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-2 hover:text-koa-boost hover:bg-koa-boost/10",
                isBoosted ? "text-koa-boost" : "text-muted-foreground"
              )}
              onClick={handleBoost}
              disabled={!profile || isLoading}
            >
              <Repeat2 className={cn("h-4 w-4", isBoosted && "fill-current")} />
              <span className="text-sm">{formatCount(boostsCount)}</span>
            </Button>

            {/* Favorite */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-2 hover:text-primary hover:bg-primary/10",
                isFavorited ? "text-primary" : "text-muted-foreground"
              )}
              onClick={handleFavorite}
              disabled={!profile || isLoading}
            >
              <Heart className={cn("h-4 w-4 transition-transform", isFavorited && "fill-current animate-heart-pop")} />
              <span className="text-sm">{formatCount(favoritesCount)}</span>
            </Button>

            {/* Share */}
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary hover:bg-primary/10"
            >
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

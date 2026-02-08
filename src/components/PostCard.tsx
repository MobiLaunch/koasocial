import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Repeat2, Share, MoreHorizontal, Sparkles } from 'lucide-react';
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
import { ParsedContent } from '@/lib/parseContent';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { Link } from 'react-router-dom';

interface PostCardProps {
  post: Post;
  onReply?: (post: Post) => void;
  onInteractionChange?: () => void;
}

// Floating particle component for visual feedback
function FloatingParticle({ emoji, onComplete }: { emoji: string; onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 600);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <span className="absolute -top-2 left-1/2 -translate-x-1/2 animate-float-up pointer-events-none text-lg">
      {emoji}
    </span>
  );
}

export function PostCard({ post, onReply, onInteractionChange }: PostCardProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isFavorited, setIsFavorited] = useState(post.is_favorited || false);
  const [isBoosted, setIsBoosted] = useState(post.is_boosted || false);
  const [favoritesCount, setFavoritesCount] = useState(post.favorites_count || 0);
  const [boostsCount, setBoostsCount] = useState(post.boosts_count || 0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation states
  const [heartAnimating, setHeartAnimating] = useState(false);
  const [boostAnimating, setBoostAnimating] = useState(false);
  const [showHeartParticle, setShowHeartParticle] = useState(false);
  const [showBoostParticle, setShowBoostParticle] = useState(false);
  const [countBump, setCountBump] = useState<'heart' | 'boost' | null>(null);

  const author = post.author as Profile;

  const handleFavorite = async () => {
    if (!profile || isLoading) return;

    // Optimistic UI update with animation
    const newFavorited = !isFavorited;
    setIsFavorited(newFavorited);
    setFavoritesCount(prev => newFavorited ? prev + 1 : prev - 1);
    
    if (newFavorited) {
      setHeartAnimating(true);
      setShowHeartParticle(true);
      setCountBump('heart');
      setTimeout(() => {
        setHeartAnimating(false);
        setCountBump(null);
      }, 400);
    }

    setIsLoading(true);
    try {
      await toggleFavorite(profile.id, post.id, !newFavorited);
      onInteractionChange?.();
    } catch (error: any) {
      // Revert on error
      setIsFavorited(!newFavorited);
      setFavoritesCount(prev => newFavorited ? prev - 1 : prev + 1);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBoost = async () => {
    if (!profile || isLoading) return;

    // Optimistic UI update with animation
    const newBoosted = !isBoosted;
    setIsBoosted(newBoosted);
    setBoostsCount(prev => newBoosted ? prev + 1 : prev - 1);
    
    if (newBoosted) {
      setBoostAnimating(true);
      setShowBoostParticle(true);
      setCountBump('boost');
      setTimeout(() => {
        setBoostAnimating(false);
        setCountBump(null);
      }, 500);
    }

    setIsLoading(true);
    try {
      await toggleBoost(profile.id, post.id, !newBoosted);
      onInteractionChange?.();
    } catch (error: any) {
      // Revert on error
      setIsBoosted(!newBoosted);
      setBoostsCount(prev => newBoosted ? prev - 1 : prev + 1);
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
        <Link to={`/u/${author.username}`} className="flex-shrink-0">
          <Avatar className="h-12 w-12 ring-2 ring-background cursor-pointer hover:opacity-80 transition-opacity">
            <AvatarImage src={author.avatar_url || undefined} alt={author.display_name} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {author.display_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-2 min-w-0">
              <Link 
                to={`/u/${author.username}`} 
                className="font-semibold text-foreground truncate flex items-center gap-1 hover:underline"
              >
                {author.display_name}
                {author.is_verified && (
                  <VerifiedBadge tier={author.verification_tier} size="sm" />
                )}
              </Link>
              <Link 
                to={`/u/${author.username}`}
                className="text-sm text-muted-foreground truncate hover:underline"
              >
                {formatHandle(author.username)}
              </Link>
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
            <ParsedContent content={post.content} />
          </p>

          {/* Post image */}
          {post.image_url && (
            <div className="mt-3 rounded-xl overflow-hidden border">
              <img
                src={post.image_url}
                alt="Post attachment"
                className="w-full max-h-96 object-cover hover:opacity-95 transition-opacity cursor-pointer"
                loading="lazy"
              />
            </div>
          )}

          {/* Action bar */}
          <div className="flex items-center justify-between mt-4 max-w-md">
            {/* Reply */}
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 group"
              onClick={() => onReply?.(post)}
            >
              <MessageCircle className="h-4 w-4 group-hover:animate-wiggle" />
              <span className="text-sm">{formatCount(post.replies_count || 0)}</span>
            </Button>

            {/* Boost */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-2 transition-all duration-200 group relative",
                isBoosted 
                  ? "text-koa-boost hover:text-koa-boost hover:bg-koa-boost/10" 
                  : "text-muted-foreground hover:text-koa-boost hover:bg-koa-boost/10"
              )}
              onClick={handleBoost}
              disabled={!profile || isLoading}
            >
              {showBoostParticle && (
                <FloatingParticle emoji="🔄" onComplete={() => setShowBoostParticle(false)} />
              )}
              <div className="relative">
                <Repeat2 
                  className={cn(
                    "h-4 w-4 transition-all duration-200",
                    boostAnimating && "animate-boost-spin",
                    isBoosted && "fill-current"
                  )} 
                />
                {isBoosted && !boostAnimating && (
                  <span className="absolute inset-0 animate-ping-once rounded-full bg-koa-boost/30" />
                )}
              </div>
              <span className={cn(
                "text-sm transition-transform duration-200",
                countBump === 'boost' && "animate-count-bump font-semibold"
              )}>
                {formatCount(boostsCount)}
              </span>
            </Button>

            {/* Favorite */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-2 transition-all duration-200 group relative",
                isFavorited 
                  ? "text-primary hover:text-primary hover:bg-primary/10" 
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              )}
              onClick={handleFavorite}
              disabled={!profile || isLoading}
            >
              {showHeartParticle && (
                <FloatingParticle emoji="❤️" onComplete={() => setShowHeartParticle(false)} />
              )}
              <div className="relative">
                <Heart 
                  className={cn(
                    "h-4 w-4 transition-all duration-200",
                    heartAnimating && "animate-heart-pop",
                    isFavorited && "fill-current"
                  )} 
                />
                {isFavorited && !heartAnimating && (
                  <span className="absolute inset-0 animate-ping-once rounded-full bg-primary/30" />
                )}
              </div>
              <span className={cn(
                "text-sm transition-transform duration-200",
                countBump === 'heart' && "animate-count-bump font-semibold"
              )}>
                {formatCount(favoritesCount)}
              </span>
            </Button>

            {/* Share */}
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 group"
            >
              <Share className="h-4 w-4 group-hover:animate-wiggle" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

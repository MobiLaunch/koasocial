import { useState, useEffect, useCallback } from 'react';
import { Home as HomeIcon, Loader2 } from 'lucide-react';
import { PostCard } from '@/components/PostCard';
import { useAuth } from '@/contexts/AuthContext';
import { getUserInteractions, type Post } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

const PAGE_SIZE = 15;

export default function HomePage() {
  const { profile } = useAuth();

  const fetchPosts = useCallback(async (cursor?: string) => {
    let query = supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(*)
      `)
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data: posts, error } = await query;

    if (error) throw error;

    // Get counts for each post
    const postsWithCounts = await Promise.all(
      (posts || []).map(async (post) => {
        const [repliesRes, boostsRes, favoritesRes] = await Promise.all([
          supabase.from('posts').select('id', { count: 'exact', head: true }).eq('reply_to_id', post.id),
          supabase.from('boosts').select('id', { count: 'exact', head: true }).eq('post_id', post.id),
          supabase.from('favorites').select('id', { count: 'exact', head: true }).eq('post_id', post.id),
        ]);

        return {
          ...post,
          replies_count: repliesRes.count || 0,
          boosts_count: boostsRes.count || 0,
          favorites_count: favoritesRes.count || 0,
        };
      })
    );

    // Get user interactions if logged in
    let finalPosts = postsWithCounts;
    if (profile && postsWithCounts.length > 0) {
      const postIds = postsWithCounts.map(p => p.id);
      const interactions = await getUserInteractions(profile.id, postIds);
      
      finalPosts = postsWithCounts.map(post => ({
        ...post,
        is_favorited: interactions.favoritedPostIds.has(post.id),
        is_boosted: interactions.boostedPostIds.has(post.id),
      }));
    }

    const nextCursor = posts && posts.length >= PAGE_SIZE 
      ? posts[posts.length - 1].created_at 
      : undefined;

    return { data: finalPosts as Post[], nextCursor };
  }, [profile]);

  const { 
    items: posts, 
    loading, 
    loadingMore, 
    hasMore, 
    refresh, 
    sentinelRef 
  } = useInfiniteScroll<Post>({ 
    fetchFn: fetchPosts, 
    pageSize: PAGE_SIZE 
  });

  return (
    <div className="animate-fade-in">
      {/* Header - hidden on mobile since we have MobileHeader */}
      <header className="hidden lg:block sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <HomeIcon className="h-6 w-6 text-primary" />
          <h1 className="font-display text-xl font-bold text-foreground">Home</h1>
        </div>
      </header>

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : posts.length > 0 ? (
        <div className="divide-y divide-border">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onInteractionChange={refresh}
            />
          ))}
          
          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="h-1" />
          
          {loadingMore && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          
          {!hasMore && (
            <div className="p-8 text-center text-muted-foreground">
              <p>You're all caught up! 🎉</p>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          <p className="text-lg mb-2">No posts yet!</p>
          <p>Be the first to share something 🐨</p>
        </div>
      )}
    </div>
  );
}

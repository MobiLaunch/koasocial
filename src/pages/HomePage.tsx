import { useState, useEffect, useCallback } from 'react';
import { Home as HomeIcon, Loader2, Sparkles, Plus, Newspaper } from 'lucide-react';
import { PostCard } from '@/components/PostCard';
import { TrendingNews } from '@/components/TrendingNews';
import { ComposeModal } from '@/components/ComposeModal';
import { useAuth } from '@/contexts/AuthContext';
import { getUserInteractions, type Post } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { seedDatabase, checkIfSeedDataExists } from '@/lib/seedData';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const PAGE_SIZE = 15;

export default function HomePage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [composeOpen, setComposeOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedDataExists, setSeedDataExists] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'news'>('home');

  useEffect(() => {
    checkIfSeedDataExists().then(setSeedDataExists);
  }, []);

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

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    try {
      const result = await seedDatabase();
      if (result.success) {
        toast({
          title: 'Welcome to KoaSocial!',
          description: 'We\'ve added some initial content to get you started.',
        });
        setSeedDataExists(true);
        refresh();
      } else {
        toast({
          title: 'Oops!',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to seed database',
        variant: 'destructive',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const isEmptyTimeline = !loading && posts.length === 0;
  const showSeedOption = isEmptyTimeline && seedDataExists === false;

  return (
    <div className="animate-fade-in">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <HomeIcon className="h-6 w-6 text-primary" />
            <h1 className="font-display text-xl font-bold text-foreground">Home</h1>
          </div>
          <Button
            size="sm"
            onClick={() => setComposeOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Post</span>
          </Button>
        </div>

        {/* Tabs for Home / News */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="w-full">
            <TabsTrigger value="home" className="flex-1 gap-2">
              <HomeIcon className="h-4 w-4" />
              Home
            </TabsTrigger>
            <TabsTrigger value="news" className="flex-1 gap-2">
              <Newspaper className="h-4 w-4" />
              News
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      {/* Home Tab */}
      {activeTab === 'home' && (
        <>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="h-12 w-12 rounded-2xl koa-gradient flex items-center justify-center animate-pulse">
                <div className="text-2xl font-bold text-white">K</div>
              </div>
              <p className="text-sm text-muted-foreground">Loading your timeline...</p>
            </div>
          ) : isEmptyTimeline ? (
            <div className="p-6 max-w-lg mx-auto">
              <Card className="p-8 text-center space-y-6">
                <div className="flex justify-center">
                  <div className="h-20 w-20 rounded-3xl koa-gradient flex items-center justify-center">
                    <div className="text-5xl font-bold text-white">K</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">Welcome to KoaSocial!</h2>
                  <p className="text-muted-foreground">
                    This is a warm, friendly place to connect and share. Let's get you started!
                  </p>
                </div>

                {showSeedOption && (
                  <div className="space-y-4 pt-4">
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex items-start gap-3 mb-3">
                        <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                        <div className="text-left flex-1">
                          <h3 className="font-semibold text-foreground mb-1">New here?</h3>
                          <p className="text-sm text-muted-foreground">
                            We can add some example content and friendly accounts to help you explore KoaSocial!
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleSeedDatabase}
                        disabled={isSeeding}
                        className="w-full gap-2"
                        variant="default"
                      >
                        {isSeeding ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Setting up...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Add Example Content
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Or skip ahead and...
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <Button
                    onClick={() => setComposeOpen(true)}
                    size="lg"
                    className="w-full gap-2"
                    variant={showSeedOption ? "outline" : "default"}
                  >
                    <Plus className="h-5 w-5" />
                    Share Your First Post
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    Or check out the{' '}
                    <button 
                      onClick={() => setActiveTab('news')} 
                      className="text-primary hover:underline"
                    >
                      News tab
                    </button>{' '}
                    to see what's trending
                  </p>
                </div>
              </Card>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onInteractionChange={refresh}
                />
              ))}
              
              <div ref={sentinelRef} className="h-1" />
              
              {loadingMore && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
              
              {!hasMore && posts.length > 0 && (
                <div className="p-8 text-center space-y-3">
                  <p className="text-muted-foreground">You're all caught up!</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setComposeOpen(true)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Share something new
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* News Tab */}
      {activeTab === 'news' && (
        <div className="p-4">
          <TrendingNews fullPage />
        </div>
      )}

      <Button
        onClick={() => setComposeOpen(true)}
        size="lg"
        className="fixed bottom-20 right-4 lg:hidden h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-40 p-0"
      >
        <Plus className="h-6 w-6" />
      </Button>

      <ComposeModal isOpen={composeOpen} onClose={() => setComposeOpen(false)} onPostCreated={refresh} />
    </div>
  );
}

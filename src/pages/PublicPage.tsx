import { useState, useEffect } from 'react';
import { Globe, Loader2, RefreshCw } from 'lucide-react';
import { PostCard } from '@/components/PostCard';
import { FederatedPostCard, type FederatedPost } from '@/components/FederatedPostCard';
import { fetchPosts, getUserInteractions, type Post } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type MixedPost = 
  | { type: 'local'; data: Post; sortDate: Date }
  | { type: 'federated'; data: FederatedPost; sortDate: Date };

export default function PublicPage() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [federatedPosts, setFederatedPosts] = useState<FederatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [federatedLoading, setFederatedLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'mixed' | 'local' | 'fediverse'>('mixed');

  const loadLocalPosts = async () => {
    try {
      const fetchedPosts = await fetchPosts({ visibility: 'public' });
      
      if (profile && fetchedPosts.length > 0) {
        const postIds = fetchedPosts.map(p => p.id);
        const interactions = await getUserInteractions(profile.id, postIds);
        
        const postsWithInteractions = fetchedPosts.map(post => ({
          ...post,
          is_favorited: interactions.favoritedPostIds.has(post.id),
          is_boosted: interactions.boostedPostIds.has(post.id),
        }));
        
        setPosts(postsWithInteractions);
      } else {
        setPosts(fetchedPosts);
      }
    } catch (error) {
      console.error('Error loading local posts:', error);
    }
  };

  const loadFederatedPosts = async () => {
    setFederatedLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-trending');
      
      if (error) throw error;
      
      if (data?.success && data.posts) {
        setFederatedPosts(data.posts);
      }
    } catch (error) {
      console.error('Error loading federated posts:', error);
    } finally {
      setFederatedLoading(false);
    }
  };

  const loadAllPosts = async () => {
    setLoading(true);
    await Promise.all([loadLocalPosts(), loadFederatedPosts()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllPosts();
  }, [profile]);

  // Merge and sort posts by date
  const getMixedPosts = (): MixedPost[] => {
    const mixed: MixedPost[] = [
      ...posts.map(p => ({ 
        type: 'local' as const, 
        data: p, 
        sortDate: new Date(p.created_at) 
      })),
      ...federatedPosts.map(p => ({ 
        type: 'federated' as const, 
        data: p, 
        sortDate: new Date(p.created_at) 
      })),
    ];
    
    return mixed.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());
  };

  const mixedPosts = getMixedPosts();

  return (
    <div className="animate-fade-in">
      {/* Header - hidden on mobile since we have MobileHeader */}
      <header className="hidden lg:block sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <Globe className="h-6 w-6 text-primary flex-shrink-0" />
              <h1 className="font-display text-xl font-bold text-foreground truncate">Public Timeline</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1 truncate">
              Posts from across the fediverse
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={loadAllPosts}
            disabled={loading || federatedLoading}
            className="flex-shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${(loading || federatedLoading) ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mt-3">
          <TabsList className="w-full">
            <TabsTrigger value="mixed" className="flex-1 text-xs sm:text-sm">Mixed</TabsTrigger>
            <TabsTrigger value="local" className="flex-1 text-xs sm:text-sm">Local</TabsTrigger>
            <TabsTrigger value="fediverse" className="flex-1 text-xs sm:text-sm">Fediverse</TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Mixed Feed */}
          {activeTab === 'mixed' && (
            mixedPosts.length > 0 ? (
              <div className="divide-y divide-border">
                {mixedPosts.map((item) => (
                  item.type === 'local' ? (
                    <PostCard
                      key={`local-${item.data.id}`}
                      post={item.data}
                      onInteractionChange={loadLocalPosts}
                    />
                  ) : (
                    <FederatedPostCard
                      key={`fed-${item.data.id}`}
                      post={item.data}
                    />
                  )
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-lg mb-2">No posts yet!</p>
                <p>Be the first to share something with the world 🌍</p>
              </div>
            )
          )}

          {/* Local Only */}
          {activeTab === 'local' && (
            posts.length > 0 ? (
              <div className="divide-y divide-border">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onInteractionChange={loadLocalPosts}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-lg mb-2">No local posts yet!</p>
                <p>Be the first to share something 🐨</p>
              </div>
            )
          )}

          {/* Fediverse Only */}
          {activeTab === 'fediverse' && (
            federatedLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : federatedPosts.length > 0 ? (
              <div className="divide-y divide-border">
                {federatedPosts.map((post) => (
                  <FederatedPostCard
                    key={post.id}
                    post={post}
                  />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-lg mb-2">No federated posts available</p>
                <p>Try refreshing to fetch trending posts ✨</p>
              </div>
            )
          )}
        </>
      )}

      {/* Load more indicator */}
      {mixedPosts.length > 0 && activeTab === 'mixed' && (
        <div className="p-8 text-center text-muted-foreground">
          <p>Keep scrolling for more! ✨</p>
        </div>
      )}
    </div>
  );
}

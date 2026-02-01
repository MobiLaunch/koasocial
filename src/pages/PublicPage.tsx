import { useState, useEffect } from 'react';
import { Globe, Loader2 } from 'lucide-react';
import { PostCard } from '@/components/PostCard';
import { fetchPosts, getUserInteractions, type Post } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function PublicPage() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const fetchedPosts = await fetchPosts({ visibility: 'public' });
      
      // Get user interactions if logged in
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
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [profile]);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 lg:top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Globe className="h-6 w-6 text-primary" />
          <h1 className="font-display text-xl font-bold text-foreground">Public Timeline</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Posts from across the fediverse
        </p>
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
              onInteractionChange={loadPosts}
            />
          ))}
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          <p className="text-lg mb-2">No public posts yet!</p>
          <p>Be the first to share something with the world 🌍</p>
        </div>
      )}

      {/* Load more indicator */}
      {posts.length > 0 && (
        <div className="p-8 text-center text-muted-foreground">
          <p>Keep scrolling for more! ✨</p>
        </div>
      )}
    </div>
  );
}

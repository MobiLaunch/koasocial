import { useState, useEffect, useCallback } from 'react';
import { Search, Users, FileText, Loader2, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PostCard } from '@/components/PostCard';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { getUserInteractions, type Post, type Profile } from '@/lib/api';
import { formatHandle } from '@/lib/formatters';
import { Link } from 'react-router-dom';
import { RemoteAccountSearch } from '@/components/RemoteAccountSearch';
import { TrendingNews } from '@/components/TrendingNews';

export default function SearchPage() {
  const { profile: currentProfile } = useAuth();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchPosts = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setPosts([]);
      return;
    }

    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(*)
      `)
      .or(`visibility.eq.public,visibility.eq.unlisted`)
      .ilike('content', `%${searchQuery}%`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error searching posts:', error);
      return;
    }

    // Get counts and user interactions
    const postsWithCounts = await Promise.all(
      (data || []).map(async (post) => {
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

    // Add user interactions if logged in
    if (currentProfile && postsWithCounts.length > 0) {
      const postIds = postsWithCounts.map(p => p.id);
      const interactions = await getUserInteractions(currentProfile.id, postIds);
      
      const postsWithInteractions = postsWithCounts.map(post => ({
        ...post,
        is_favorited: interactions.favoritedPostIds.has(post.id),
        is_boosted: interactions.boostedPostIds.has(post.id),
      }));
      
      setPosts(postsWithInteractions as Post[]);
    } else {
      setPosts(postsWithCounts as Post[]);
    }
  }, [currentProfile]);

  const searchUsers = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setUsers([]);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
      .limit(50);

    if (error) {
      console.error('Error searching users:', error);
      return;
    }

    setUsers(data as Profile[]);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      setPosts([]);
      setUsers([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    await Promise.all([
      searchPosts(query),
      searchUsers(query),
    ]);

    setLoading(false);
  }, [query, searchPosts, searchUsers]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  const refreshPosts = () => {
    if (query.trim()) {
      searchPosts(query);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="px-4 py-3">
          <h1 className="font-display text-xl font-bold">Search</h1>
        </div>
        
        {/* Search input */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder={activeTab === 'fediverse' ? '@user@instance.domain' : 'Search posts and users...'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 rounded-xl h-12"
              autoFocus
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : hasSearched ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0">
            <TabsTrigger
              value="posts"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 gap-2"
            >
              <FileText className="h-4 w-4" />
              Posts
              {posts.length > 0 && (
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                  {posts.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 gap-2"
            >
              <Users className="h-4 w-4" />
              People
              {users.length > 0 && (
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                  {users.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="fediverse"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3 gap-2"
            >
              <Globe className="h-4 w-4" />
              Fediverse
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-0">
            {posts.length > 0 ? (
              <div className="divide-y divide-border">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} onInteractionChange={refreshPosts} />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No posts found for "{query}"</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="mt-0">
            {users.length > 0 ? (
              <div className="divide-y divide-border">
                {users.map((user) => (
                  <Link
                    key={user.id}
                    to={`/@${user.username}`}
                    className="flex items-center gap-3 p-4 hover:bg-accent transition-colors"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar_url || undefined} alt={user.display_name} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.display_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground truncate">
                        {user.display_name}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {formatHandle(user.username, user.instance)}
                      </div>
                      {user.bio && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {user.bio}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No users found for "{query}"</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="fediverse" className="mt-0 p-4">
            <RemoteAccountSearch />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="p-4">
          <TrendingNews />
        </div>
      )}
    </div>
  );
}

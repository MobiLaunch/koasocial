import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostCard } from '@/components/PostCard';
import { useAuth } from '@/contexts/AuthContext';
import { fetchPosts, getUserInteractions, type Post } from '@/lib/api';
import { formatCount, formatHandle } from '@/lib/formatters';
import { supabase } from '@/integrations/supabase/client';

export default function ProfilePage() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ followers: 0, following: 0 });

  const loadPosts = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      const fetchedPosts = await fetchPosts({ authorId: profile.id });
      
      if (fetchedPosts.length > 0) {
        const postIds = fetchedPosts.map(p => p.id);
        const interactions = await getUserInteractions(profile.id, postIds);
        
        const postsWithInteractions = fetchedPosts.map(post => ({
          ...post,
          is_favorited: interactions.favoritedPostIds.has(post.id),
          is_boosted: interactions.boostedPostIds.has(post.id),
        }));
        
        setPosts(postsWithInteractions);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!profile) return;

    const [followersRes, followingRes] = await Promise.all([
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', profile.id),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', profile.id),
    ]);

    setStats({
      followers: followersRes.count || 0,
      following: followingRes.count || 0,
    });
  };

  useEffect(() => {
    loadPosts();
    loadStats();
  }, [profile]);

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const joinedDate = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="animate-fade-in">
      {/* Banner */}
      <div className="relative h-48 bg-gradient-to-br from-primary/30 to-koa-peach/30">
        {profile.banner_url && (
          <img
            src={profile.banner_url}
            alt="Profile banner"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Profile header */}
      <div className="relative px-4 pb-4 border-b">
        {/* Avatar */}
        <div className="relative -mt-16 mb-4">
          <Avatar className="h-32 w-32 ring-4 ring-background">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
            <AvatarFallback className="bg-primary/10 text-primary text-4xl">
              {profile.display_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Action buttons */}
        <div className="absolute right-4 top-4 flex gap-2">
          <Button className="rounded-full koa-gradient text-primary-foreground hover:opacity-90">
            Edit profile
          </Button>
        </div>

        {/* User info */}
        <div className="mt-2">
          <h1 className="font-display text-2xl font-bold text-foreground">
            {profile.display_name}
          </h1>
          <p className="text-muted-foreground">
            {formatHandle(profile.username, profile.instance)}
          </p>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="mt-3 text-foreground leading-relaxed">
            {profile.bio}
          </p>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Joined {joinedDate}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mt-4">
          <Link to="#" className="hover:underline">
            <span className="font-bold text-foreground">{formatCount(stats.following)}</span>
            <span className="text-muted-foreground ml-1">Following</span>
          </Link>
          <Link to="#" className="hover:underline">
            <span className="font-bold text-foreground">{formatCount(stats.followers)}</span>
            <span className="text-muted-foreground ml-1">Followers</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0">
          <TabsTrigger
            value="posts"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
          >
            Posts
          </TabsTrigger>
          <TabsTrigger
            value="replies"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
          >
            Replies
          </TabsTrigger>
          <TabsTrigger
            value="media"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
          >
            Media
          </TabsTrigger>
          <TabsTrigger
            value="likes"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
          >
            Likes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : posts.length > 0 ? (
            <div className="divide-y divide-border">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onInteractionChange={loadPosts} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <p>No posts yet</p>
              <p className="text-sm mt-1">When you post, it'll show up here</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="replies" className="mt-0">
          <div className="p-8 text-center text-muted-foreground">
            <p>No replies yet</p>
          </div>
        </TabsContent>

        <TabsContent value="media" className="mt-0">
          <div className="p-8 text-center text-muted-foreground">
            <p>No media posts yet</p>
          </div>
        </TabsContent>

        <TabsContent value="likes" className="mt-0">
          <div className="p-8 text-center text-muted-foreground">
            <p>Likes are private</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

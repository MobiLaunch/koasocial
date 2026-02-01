import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Loader2, Sparkles, MapPin, Link as LinkIcon, Edit3, BadgeCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PostCard } from '@/components/PostCard';
import { SocialLinksDisplay } from '@/components/SocialLinksDisplay';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { VerificationRequestModal } from '@/components/VerificationRequestModal';
import { useAuth } from '@/contexts/AuthContext';
import { fetchPosts, getUserInteractions, type Post } from '@/lib/api';
import { formatCount, formatHandle } from '@/lib/formatters';
import { supabase } from '@/integrations/supabase/client';

export default function ProfilePage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ followers: 0, following: 0 });
  const [showVerificationModal, setShowVerificationModal] = useState(false);

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
      <div className="relative h-48 sm:h-56 bg-gradient-to-br from-primary/30 via-koa-peach/40 to-koa-cream/30 overflow-hidden">
        {profile.banner_url ? (
          <img
            src={profile.banner_url}
            alt="Profile banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-koa-peach/30 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-koa-coral/10 rounded-full blur-2xl" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
      </div>

      {/* Profile header */}
      <div className="relative px-4 pb-6 border-b">
        {/* Avatar */}
        <div className="relative -mt-16 sm:-mt-20 mb-4">
          <div className="relative inline-block">
            <Avatar className="h-28 w-28 sm:h-36 sm:w-36 ring-4 ring-background shadow-xl">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
              <AvatarFallback className="koa-gradient text-primary-foreground text-3xl sm:text-4xl font-bold">
                {profile.display_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 bg-koa-success rounded-full p-1.5 ring-2 ring-background" style={{ backgroundColor: 'hsl(var(--koa-success))' }}>
              <Sparkles className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="absolute right-4 top-4 flex gap-2">
          <Button
            onClick={() => navigate('/profile/edit')}
            className="rounded-full koa-gradient text-primary-foreground hover:opacity-90 koa-shadow transition-all duration-300 hover:scale-105 gap-2"
          >
            <Edit3 className="h-4 w-4" />
            <span className="hidden sm:inline">Edit profile</span>
          </Button>
        </div>

        {/* User info */}
        <div className="mt-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
              {profile.display_name}
              {profile.is_verified && (
                <VerifiedBadge tier={profile.verification_tier} size="lg" />
              )}
            </h1>
            {profile.is_verified ? (
              <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary">
                {profile.verification_tier === 'founder' ? '🐨 Founder' : '✓ Verified'}
              </Badge>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-xs h-7 gap-1"
                onClick={() => setShowVerificationModal(true)}
              >
                <BadgeCheck className="h-3.5 w-3.5" />
                Get verified
              </Button>
            )}
          </div>
          <p className="text-muted-foreground mt-1 font-medium">
            {formatHandle(profile.username, profile.instance)}
          </p>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="mt-4 text-foreground leading-relaxed whitespace-pre-wrap">
            {profile.bio}
          </p>
        )}

        {/* Interests */}
        {(profile as any).interests && (profile as any).interests.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {(profile as any).interests.map((interest: string) => (
              <span
                key={interest}
                className="px-3 py-1 text-sm rounded-full bg-primary/10 text-primary font-medium"
              >
                {interest}
              </span>
            ))}
          </div>
        )}

        {/* Social Links */}
        {(profile as any).social_links && Object.keys((profile as any).social_links).length > 0 && (
          <div className="mt-4">
            <SocialLinksDisplay links={(profile as any).social_links} compact />
          </div>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5 bg-accent/30 px-3 py-1.5 rounded-full">
            <Calendar className="h-4 w-4 text-primary" />
            Joined {joinedDate}
          </span>
          {profile.instance && (
            <span className="flex items-center gap-1.5 bg-accent/30 px-3 py-1.5 rounded-full">
              <LinkIcon className="h-4 w-4 text-primary" />
              {profile.instance}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mt-5">
          <Link to="#" className="group hover:no-underline">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/30 group-hover:bg-accent/50 transition-colors">
              <span className="font-bold text-foreground text-lg">{formatCount(stats.following)}</span>
              <span className="text-muted-foreground text-sm">Following</span>
            </div>
          </Link>
          <Link to="#" className="group hover:no-underline">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/30 group-hover:bg-accent/50 transition-colors">
              <span className="font-bold text-foreground text-lg">{formatCount(stats.followers)}</span>
              <span className="text-muted-foreground text-sm">Followers</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0 overflow-x-auto">
          <TabsTrigger
            value="posts"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-6 py-3.5 font-semibold transition-all"
          >
            Posts
          </TabsTrigger>
          <TabsTrigger
            value="replies"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-6 py-3.5 font-semibold transition-all"
          >
            Replies
          </TabsTrigger>
          <TabsTrigger
            value="media"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-6 py-3.5 font-semibold transition-all"
          >
            Media
          </TabsTrigger>
          <TabsTrigger
            value="likes"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-6 py-3.5 font-semibold transition-all"
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
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/50 mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-medium text-foreground">No posts yet</p>
              <p className="text-sm mt-1 text-muted-foreground">When you post, it'll show up here ✨</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="replies" className="mt-0">
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/50 mb-4">
              <span className="text-3xl">💬</span>
            </div>
            <p className="text-lg font-medium text-foreground">No replies yet</p>
            <p className="text-sm mt-1 text-muted-foreground">Your replies to others will appear here</p>
          </div>
        </TabsContent>

        <TabsContent value="media" className="mt-0">
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/50 mb-4">
              <span className="text-3xl">📸</span>
            </div>
            <p className="text-lg font-medium text-foreground">No media posts yet</p>
            <p className="text-sm mt-1 text-muted-foreground">Photos and videos will show up here</p>
          </div>
        </TabsContent>

        <TabsContent value="likes" className="mt-0">
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/50 mb-4">
              <span className="text-3xl">❤️</span>
            </div>
            <p className="text-lg font-medium text-foreground">Likes are private</p>
            <p className="text-sm mt-1 text-muted-foreground">Only you can see what you've liked</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Verification Request Modal */}
      <VerificationRequestModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
      />
    </div>
  );
}

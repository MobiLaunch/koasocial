import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/PostCard";
import { SocialLinksDisplay } from "@/components/SocialLinksDisplay";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { useAuth } from "@/contexts/AuthContext";
import { fetchPosts, fetchProfile, getUserInteractions, toggleFollow, type Post, type Profile } from "@/lib/api";
import { formatCount, formatHandle } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { profile: currentProfile } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const cleanUsername = username?.replace("@", "") || "";

  const loadProfile = async () => {
    if (!username) return;

    const identifier = username.replace("@", "").trim();
    const lookupById = isUUID(identifier);

    setLoading(true);

    try {
      // 1️⃣ Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq(lookupById ? "id" : "username", identifier)
        .single();

      if (profileError) throw profileError;

      setProfile(profileData as Profile);

      // 2️⃣ Follow state
      if (currentProfile && currentProfile.id !== profileData.id) {
        const { data: followData } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", currentProfile.id)
          .eq("following_id", profileData.id)
          .maybeSingle();

        setIsFollowing(!!followData);
      } else {
        setIsFollowing(false);
      }

      // 3️⃣ Load posts
      const fetchedPosts = await fetchPosts({ authorId: profileData.id });

      // 4️⃣ Load interactions
      if (currentProfile && fetchedPosts.length > 0) {
        const postIds = fetchedPosts.map((p) => p.id);
        const interactions = await getUserInteractions(currentProfile.id, postIds);

        setPosts(
          fetchedPosts.map((post) => ({
            ...post,
            is_favorited: interactions.favoritedPostIds.has(post.id),
            is_boosted: interactions.boostedPostIds.has(post.id),
          })),
        );
      } else {
        setPosts(fetchedPosts);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      setProfile(null);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [cleanUsername, currentProfile]);

  const handleFollow = async () => {
    if (!currentProfile || !profile) return;

    setFollowLoading(true);
    try {
      await toggleFollow(currentProfile.id, profile.id, isFollowing);
      setIsFollowing(!isFollowing);

      // Update follower count locally
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              followers_count: (prev.followers_count || 0) + (isFollowing ? -1 : 1),
            }
          : null,
      );
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center">
        <h2 className="font-display text-xl font-bold mb-2">User not found</h2>
        <p className="text-muted-foreground">The user @{cleanUsername} doesn't exist.</p>
        <Link to="/search" className="text-primary hover:underline mt-4 inline-block">
          Back to search
        </Link>
      </div>
    );
  }

  const joinedDate = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const isOwnProfile = currentProfile?.id === profile.id;

  return (
    <div className="animate-fade-in">
      {/* Header - hidden on mobile since we have MobileHeader */}
      <div className="hidden lg:block sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-xl font-bold">{profile.display_name}</h1>
            <p className="text-sm text-muted-foreground">{profile.posts_count || 0} posts</p>
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className="relative h-48 bg-gradient-to-br from-primary/30 to-koa-peach/30">
        {profile.banner_url && (
          <img src={profile.banner_url} alt="Profile banner" className="w-full h-full object-cover" />
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
          {isOwnProfile ? (
            <Link to="/profile/edit">
              <Button className="rounded-full koa-gradient text-primary-foreground hover:opacity-90">
                Edit profile
              </Button>
            </Link>
          ) : (
            <Button
              onClick={handleFollow}
              disabled={followLoading}
              className={`rounded-full ${
                isFollowing
                  ? "bg-muted text-foreground hover:bg-destructive hover:text-destructive-foreground"
                  : "koa-gradient text-primary-foreground hover:opacity-90"
              }`}
            >
              {followLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isFollowing ? "Following" : "Follow"}
            </Button>
          )}
        </div>

        {/* User info */}
        <div className="mt-2">
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
            {profile.display_name}
            {(profile as any).is_verified && <VerifiedBadge tier={(profile as any).verification_tier} size="lg" />}
          </h1>
          <p className="text-muted-foreground">{formatHandle(profile.username, profile.instance)}</p>
        </div>

        {/* Bio */}
        {profile.bio && <p className="mt-3 text-foreground leading-relaxed">{profile.bio}</p>}

        {/* Social Links */}
        {(profile as any).social_links && Object.keys((profile as any).social_links).length > 0 && (
          <div className="mt-4">
            <SocialLinksDisplay links={(profile as any).social_links} compact />
          </div>
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
          <span>
            <span className="font-bold text-foreground">{formatCount(profile.following_count || 0)}</span>
            <span className="text-muted-foreground ml-1">Following</span>
          </span>
          <span>
            <span className="font-bold text-foreground">{formatCount(profile.followers_count || 0)}</span>
            <span className="text-muted-foreground ml-1">Followers</span>
          </span>
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
        </TabsList>

        <TabsContent value="posts" className="mt-0">
          {posts.length > 0 ? (
            <div className="divide-y divide-border">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onInteractionChange={loadProfile} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <p>No posts yet</p>
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
      </Tabs>
    </div>
  );
}

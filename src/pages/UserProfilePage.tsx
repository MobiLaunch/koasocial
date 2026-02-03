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
import { fetchPosts, getUserInteractions, toggleFollow, type Post, type Profile } from "@/lib/api";
import { formatCount, formatHandle } from "@/lib/formatters";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/* ---------------- helpers ---------------- */

const isUUID = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

/* ---------------- component ---------------- */

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { profile: currentProfile } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  /* ---------------- data loading ---------------- */

  const loadProfile = async () => {
    if (!username) return;

    const identifier = username.replace("@", "").trim();
    const lookupById = isUUID(identifier);

    setLoading(true);

    try {
      // 1️⃣ Fetch profile
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq(lookupById ? "id" : "username", identifier)
        .single();

      if (error) throw error;

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

      // 3️⃣ Posts
      const fetchedPosts = await fetchPosts({ authorId: profileData.id });

      // 4️⃣ Interactions
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
    } catch (err) {
      console.error("Error loading profile:", err);
      setProfile(null);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [username, currentProfile?.id]);

  /* ---------------- actions ---------------- */

  const handleFollow = async () => {
    if (!currentProfile || !profile) return;

    setFollowLoading(true);
    try {
      await toggleFollow(currentProfile.id, profile.id, isFollowing);
      setIsFollowing((prev) => !prev);

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

  /* ---------------- render guards ---------------- */

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
        <p className="text-muted-foreground">The user @{username?.replace("@", "")} doesn't exist.</p>
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

  /* ---------------- render ---------------- */

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="hidden lg:block sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-4 py-3">
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
        <div className="relative -mt-16 mb-4">
          <Avatar className="h-32 w-32 ring-4 ring-background">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-4xl">
              {profile.display_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="absolute right-4 top-4">
          {isOwnProfile ? (
            <Link to="/profile/edit">
              <Button className="rounded-full koa-gradient text-primary-foreground">Edit profile</Button>
            </Link>
          ) : (
            <Button
              onClick={handleFollow}
              disabled={followLoading}
              className={`rounded-full ${
                isFollowing
                  ? "bg-muted text-foreground hover:bg-destructive hover:text-destructive-foreground"
                  : "koa-gradient text-primary-foreground"
              }`}
            >
              {followLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isFollowing ? "Following" : "Follow"}
            </Button>
          )}
        </div>

        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          {profile.display_name}
          {(profile as any).is_verified && <VerifiedBadge tier={(profile as any).verification_tier} size="lg" />}
        </h1>

        <p className="text-muted-foreground">{formatHandle(profile.username, profile.instance)}</p>

        {profile.bio && <p className="mt-3">{profile.bio}</p>}

        {(profile as any).social_links && (
          <div className="mt-4">
            <SocialLinksDisplay links={(profile as any).social_links} compact />
          </div>
        )}

        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Joined {joinedDate}
          </span>
        </div>

        <div className="flex gap-6 mt-4">
          <span>
            <strong>{formatCount(profile.following_count || 0)}</strong> Following
          </span>
          <span>
            <strong>{formatCount(profile.followers_count || 0)}</strong> Followers
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="posts">
        <TabsList className="border-b rounded-none">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="replies">Replies</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          {posts.length ? (
            <div className="divide-y">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onInteractionChange={loadProfile} />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">No posts yet</div>
          )}
        </TabsContent>

        <TabsContent value="replies" className="p-8 text-center text-muted-foreground">
          No replies yet
        </TabsContent>

        <TabsContent value="media" className="p-8 text-center text-muted-foreground">
          No media posts yet
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useState } from 'react';
import { Globe, Search, Loader2, UserPlus, UserMinus, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface RemoteActor {
  id: string;
  actor_uri: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  summary: string | null;
  instance: string;
  followers_url: string | null;
  following_url: string | null;
}

interface RemoteAccountSearchProps {
  onClose?: () => void;
}

export function RemoteAccountSearch({ onClose }: RemoteAccountSearchProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [handle, setHandle] = useState('');
  const [loading, setLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [actor, setActor] = useState<RemoteActor | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!handle.trim()) return;

    setLoading(true);
    setError(null);
    setActor(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('lookup-remote-actor', {
        body: null,
        headers: {},
        method: 'GET',
      });

      // Use fetch directly since invoke doesn't support query params well
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lookup-remote-actor?handle=${encodeURIComponent(handle)}`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Failed to find user');
        return;
      }

      setActor(result.actor);

      // Check if we're already following this user
      if (profile && result.actor.id) {
        const { data: followData } = await supabase
          .from('federation_follows')
          .select('id')
          .eq('local_profile_id', profile.id)
          .eq('remote_actor_id', result.actor.id)
          .eq('direction', 'outgoing')
          .single();

        setIsFollowing(!!followData);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search for user');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!actor || !profile) return;

    setFollowLoading(true);

    try {
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/follow-remote`,
        {
          method: 'POST',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            remote_actor_id: actor.id,
            action: isFollowing ? 'unfollow' : 'follow',
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update follow status',
          variant: 'destructive',
        });
        return;
      }

      setIsFollowing(!isFollowing);
      toast({
        title: isFollowing ? 'Unfollowed' : 'Follow request sent',
        description: isFollowing
          ? `You unfollowed @${actor.username}@${actor.instance}`
          : `Follow request sent to @${actor.username}@${actor.instance}`,
      });
    } catch (err) {
      console.error('Follow error:', err);
      toast({
        title: 'Error',
        description: 'Failed to update follow status',
        variant: 'destructive',
      });
    } finally {
      setFollowLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Strip HTML tags from summary
  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Globe className="h-5 w-5" />
        <span className="text-sm">Search for users on other Fediverse instances</span>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="@username@mastodon.social"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-9"
            autoFocus
          />
        </div>
        <Button onClick={handleSearch} disabled={loading || !handle.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </Button>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
          {error}
        </div>
      )}

      {actor && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={actor.avatar_url || undefined} alt={actor.display_name} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {actor.display_name?.charAt(0) || actor.username.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-lg truncate">
                      {actor.display_name || actor.username}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      @{actor.username}@{actor.instance}
                    </p>
                  </div>

                  {profile && (
                    <Button
                      onClick={handleFollow}
                      disabled={followLoading}
                      variant={isFollowing ? 'outline' : 'default'}
                      size="sm"
                    >
                      {followLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isFollowing ? (
                        <>
                          <UserMinus className="h-4 w-4 mr-1" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-1" />
                          Follow
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {actor.summary && (
                  <p className="text-sm mt-2 text-muted-foreground line-clamp-3">
                    {stripHtml(actor.summary)}
                  </p>
                )}

                <a
                  href={actor.actor_uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                >
                  <ExternalLink className="h-3 w-3" />
                  View on {actor.instance}
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !actor && !error && (
        <div className="text-center text-muted-foreground py-8">
          <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">
            Enter a Fediverse handle like <code className="bg-muted px-1 rounded">@user@mastodon.social</code>
          </p>
        </div>
      )}
    </div>
  );
}

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.93.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
  'Content-Type': 'application/activity+json',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Extract username and collection type from path
    const username = url.searchParams.get('username') || '';
    const collection = url.searchParams.get('collection') || 'followers'; // 'followers' or 'following'

    if (!username) {
      return new Response(
        JSON.stringify({ error: 'Missing username' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const instanceDomain = Deno.env.get('INSTANCE_DOMAIN') || 'koasocial.app';
    const baseUrl = `https://${instanceDomain}`;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the user
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('username', username.toLowerCase())
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    const actorId = `${baseUrl}/users/${profile.username}`;
    const collectionUrl = `${actorId}/${collection}`;

    if (collection === 'followers') {
      // Get follower counts (both local and federated)
      const [localFollowers, federatedFollowers] = await Promise.all([
        supabase
          .from('follows')
          .select('id', { count: 'exact', head: true })
          .eq('following_id', profile.id),
        supabase
          .from('federation_follows')
          .select('id', { count: 'exact', head: true })
          .eq('local_followed_id', profile.id)
          .eq('direction', 'incoming')
          .eq('status', 'accepted'),
      ]);

      const totalItems = (localFollowers.count || 0) + (federatedFollowers.count || 0);

      const followersCollection = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        id: collectionUrl,
        type: 'OrderedCollection',
        totalItems,
        // For privacy, we don't expose the actual follower list
        // Mastodon does the same by default
      };

      return new Response(JSON.stringify(followersCollection), {
        status: 200,
        headers: corsHeaders,
      });
    } else if (collection === 'following') {
      // Get following counts (both local and federated)
      const [localFollowing, federatedFollowing] = await Promise.all([
        supabase
          .from('follows')
          .select('id', { count: 'exact', head: true })
          .eq('follower_id', profile.id),
        supabase
          .from('federation_follows')
          .select('id', { count: 'exact', head: true })
          .eq('local_profile_id', profile.id)
          .eq('direction', 'outgoing')
          .eq('status', 'accepted'),
      ]);

      const totalItems = (localFollowing.count || 0) + (federatedFollowing.count || 0);

      const followingCollection = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        id: collectionUrl,
        type: 'OrderedCollection',
        totalItems,
      };

      return new Response(JSON.stringify(followingCollection), {
        status: 200,
        headers: corsHeaders,
      });
    }

    return new Response(
      JSON.stringify({ error: 'Invalid collection' }),
      { status: 400, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Collections error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});

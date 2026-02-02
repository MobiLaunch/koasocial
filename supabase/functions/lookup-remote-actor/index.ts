import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.93.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

// Parse a handle like @user@instance.domain or user@instance.domain
function parseHandle(handle: string): { username: string; instance: string } | null {
  // Remove leading @ if present
  const cleaned = handle.startsWith('@') ? handle.slice(1) : handle;
  const parts = cleaned.split('@');
  
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return null;
  }
  
  return {
    username: parts[0].toLowerCase(),
    instance: parts[1].toLowerCase(),
  };
}

// Perform WebFinger lookup
async function webfingerLookup(username: string, instance: string): Promise<string | null> {
  const resource = `acct:${username}@${instance}`;
  const webfingerUrl = `https://${instance}/.well-known/webfinger?resource=${encodeURIComponent(resource)}`;
  
  try {
    const response = await fetch(webfingerUrl, {
      headers: {
        'Accept': 'application/jrd+json, application/json',
      },
    });
    
    if (!response.ok) {
      console.error(`WebFinger lookup failed: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    // Find the ActivityPub actor link
    const actorLink = data.links?.find(
      (link: any) => link.rel === 'self' && link.type === 'application/activity+json'
    );
    
    return actorLink?.href || null;
  } catch (error) {
    console.error('WebFinger error:', error);
    return null;
  }
}

// Fetch the ActivityPub actor
async function fetchActor(actorUrl: string): Promise<any | null> {
  try {
    const response = await fetch(actorUrl, {
      headers: {
        'Accept': 'application/activity+json, application/ld+json',
      },
    });
    
    if (!response.ok) {
      console.error(`Actor fetch failed: ${response.status}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Actor fetch error:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const handle = url.searchParams.get('handle');

    if (!handle) {
      return new Response(
        JSON.stringify({ error: 'Missing handle parameter' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Parse the handle
    const parsed = parseHandle(handle);
    if (!parsed) {
      return new Response(
        JSON.stringify({ error: 'Invalid handle format. Use @username@instance.domain' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { username, instance } = parsed;
    const instanceDomain = Deno.env.get('INSTANCE_DOMAIN') || 'koasocial.me';

    // Check if this is a local user
    if (instance === instanceDomain) {
      return new Response(
        JSON.stringify({ error: 'This is a local user, not a remote account' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if we already have this actor cached
    const { data: cachedActor } = await supabase
      .from('remote_actors')
      .select('*')
      .eq('username', username)
      .eq('instance', instance)
      .single();

    if (cachedActor) {
      return new Response(
        JSON.stringify({
          actor: {
            id: cachedActor.id,
            actor_uri: cachedActor.actor_uri,
            username: cachedActor.username,
            display_name: cachedActor.display_name,
            avatar_url: cachedActor.avatar_url,
            summary: cachedActor.summary,
            instance: cachedActor.instance,
            followers_url: cachedActor.followers_url,
            following_url: cachedActor.following_url,
          },
          cached: true,
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Perform WebFinger lookup
    const actorUrl = await webfingerLookup(username, instance);
    if (!actorUrl) {
      return new Response(
        JSON.stringify({ error: `Could not find @${username}@${instance}` }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Fetch the actor
    const actor = await fetchActor(actorUrl);
    if (!actor) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch actor profile' }),
        { status: 502, headers: corsHeaders }
      );
    }

    // Cache the actor
    const { data: newActor, error: insertError } = await supabase
      .from('remote_actors')
      .insert({
        actor_uri: actor.id || actorUrl,
        inbox_url: actor.inbox,
        outbox_url: actor.outbox,
        shared_inbox_url: actor.endpoints?.sharedInbox,
        username: actor.preferredUsername || username,
        display_name: actor.name || actor.preferredUsername || username,
        avatar_url: actor.icon?.url || actor.icon,
        public_key: actor.publicKey?.publicKeyPem,
        public_key_id: actor.publicKey?.id,
        instance,
        followers_url: actor.followers,
        following_url: actor.following,
        summary: actor.summary,
        raw_actor: actor,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error caching actor:', insertError);
      // Still return the actor even if caching failed
    }

    return new Response(
      JSON.stringify({
        actor: {
          id: newActor?.id,
          actor_uri: actor.id || actorUrl,
          username: actor.preferredUsername || username,
          display_name: actor.name || actor.preferredUsername || username,
          avatar_url: actor.icon?.url || actor.icon,
          summary: actor.summary,
          instance,
          followers_url: actor.followers,
          following_url: actor.following,
        },
        cached: false,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Lookup error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});

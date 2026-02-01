import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.93.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept, signature, date, digest, host',
  'Content-Type': 'application/activity+json',
};

// Fetch a remote actor and cache it
async function fetchRemoteActor(actorUri: string, supabase: any): Promise<any> {
  // Check cache first
  const { data: cached } = await supabase
    .from('remote_actors')
    .select('*')
    .eq('actor_uri', actorUri)
    .single();

  if (cached) {
    return cached;
  }

  // Fetch from remote
  const response = await fetch(actorUri, {
    headers: {
      'Accept': 'application/activity+json, application/ld+json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch actor: ${response.status}`);
  }

  const actor = await response.json();

  // Extract instance from actor URI
  const actorUrl = new URL(actorUri);
  const instance = actorUrl.hostname;

  // Cache the actor
  const { data: newActor, error } = await supabase
    .from('remote_actors')
    .insert({
      actor_uri: actorUri,
      inbox_url: actor.inbox,
      outbox_url: actor.outbox,
      shared_inbox_url: actor.endpoints?.sharedInbox,
      username: actor.preferredUsername,
      display_name: actor.name,
      avatar_url: actor.icon?.url,
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

  if (error) {
    console.error('Error caching actor:', error);
    throw error;
  }

  return newActor;
}

// Process different activity types
async function processActivity(activity: any, supabase: any, instanceDomain: string): Promise<void> {
  const activityType = activity.type;

  switch (activityType) {
    case 'Follow': {
      // Someone wants to follow a local user
      const targetUri = activity.object;
      const actorUri = activity.actor;

      // Extract username from target URI
      const targetUrl = new URL(targetUri);
      const username = targetUrl.pathname.split('/').pop();

      // Find local user
      const { data: localProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();

      if (profileError || !localProfile) {
        throw new Error(`Local user not found: ${username}`);
      }

      // Get or create remote actor
      const remoteActor = await fetchRemoteActor(actorUri, supabase);

      // Create follow relationship
      await supabase.from('federation_follows').insert({
        remote_follower_id: remoteActor.id,
        local_followed_id: localProfile.id,
        direction: 'incoming',
        status: 'accepted', // Auto-accept for now
      });

      // TODO: Send Accept activity back to the remote actor
      console.log(`Accepted follow from ${actorUri} to ${username}`);
      break;
    }

    case 'Undo': {
      const innerActivity = activity.object;
      if (innerActivity.type === 'Follow') {
        // Unfollow
        const actorUri = activity.actor;
        
        const { data: remoteActor } = await supabase
          .from('remote_actors')
          .select('id')
          .eq('actor_uri', actorUri)
          .single();

        if (remoteActor) {
          await supabase
            .from('federation_follows')
            .delete()
            .eq('remote_follower_id', remoteActor.id)
            .eq('direction', 'incoming');
        }
      }
      break;
    }

    case 'Like': {
      // Someone liked a post
      console.log(`Received Like activity from ${activity.actor}`);
      // TODO: Store as a remote favorite
      break;
    }

    case 'Announce': {
      // Someone boosted a post
      console.log(`Received Announce (boost) activity from ${activity.actor}`);
      // TODO: Store as a remote boost
      break;
    }

    case 'Create': {
      // New post/reply from remote user
      console.log(`Received Create activity from ${activity.actor}`);
      // TODO: Store as a remote post (for replies to local posts)
      break;
    }

    case 'Delete': {
      // Remote user deleted something
      console.log(`Received Delete activity from ${activity.actor}`);
      // TODO: Handle deletion
      break;
    }

    case 'Update': {
      // Remote user updated their profile or post
      console.log(`Received Update activity from ${activity.actor}`);
      // TODO: Handle updates
      break;
    }

    default:
      console.log(`Unhandled activity type: ${activityType}`);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST for inbox
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    const instanceDomain = Deno.env.get('INSTANCE_DOMAIN') || 'koasocial.app';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const activity = await req.json();

    // Log the activity for debugging
    await supabase.from('federation_activities').insert({
      activity_id: activity.id || `${Date.now()}`,
      activity_type: activity.type,
      actor_uri: activity.actor,
      object_uri: typeof activity.object === 'string' ? activity.object : activity.object?.id,
      target_uri: activity.target,
      raw_activity: activity,
      direction: 'incoming',
      status: 'pending',
    });

    // TODO: Verify HTTP Signature
    // This is complex and requires parsing the Signature header
    // and verifying it against the actor's public key

    // Process the activity
    try {
      await processActivity(activity, supabase, instanceDomain);

      // Update activity status to processed
      await supabase
        .from('federation_activities')
        .update({ status: 'processed', processed_at: new Date().toISOString() })
        .eq('activity_id', activity.id || `${Date.now()}`);
    } catch (processError) {
      console.error('Error processing activity:', processError);
      
      await supabase
        .from('federation_activities')
        .update({ 
          status: 'failed', 
          error_message: processError instanceof Error ? processError.message : 'Unknown error',
          processed_at: new Date().toISOString(),
        })
        .eq('activity_id', activity.id || `${Date.now()}`);
    }

    // ActivityPub expects 202 Accepted for async processing
    return new Response(null, { status: 202, headers: corsHeaders });
  } catch (error) {
    console.error('Inbox error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});

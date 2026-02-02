import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.93.3';
import { 
  validateActivity, 
  validateUrl, 
  validateJsonSize,
  MAX_JSON_SIZE 
} from '../_shared/validation.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept, signature, date, digest, host',
  'Content-Type': 'application/activity+json',
};

const encoder = new TextEncoder();

// Parse HTTP Signature header into components
function parseSignatureHeader(signatureHeader: string): Record<string, string> | null {
  const params: Record<string, string> = {};
  const regex = /(\w+)="([^"]+)"/g;
  let match;
  
  while ((match = regex.exec(signatureHeader)) !== null) {
    params[match[1]] = match[2];
  }
  
  if (!params.keyId || !params.signature || !params.headers) {
    return null;
  }
  
  return params;
}

// Verify HTTP Signature
async function verifyHttpSignature(
  method: string,
  url: URL,
  signatureHeader: string,
  dateHeader: string,
  digestHeader: string | null,
  body: string,
  publicKeyPem: string
): Promise<boolean> {
  try {
    const params = parseSignatureHeader(signatureHeader);
    if (!params) {
      console.error('Failed to parse signature header');
      return false;
    }

    // Check if date is within acceptable range (5 minutes)
    const requestDate = new Date(dateHeader);
    const now = new Date();
    const timeDiff = Math.abs(now.getTime() - requestDate.getTime());
    const fiveMinutes = 5 * 60 * 1000;
    
    if (timeDiff > fiveMinutes) {
      console.error('Request date is too old or too far in the future');
      return false;
    }

    // Verify digest if present
    if (digestHeader && body) {
      const digestParts = digestHeader.split('=');
      if (digestParts.length === 2 && digestParts[0] === 'SHA-256') {
        const expectedDigest = digestParts[1];
        const bodyBuffer = encoder.encode(body);
        const hashBuffer = await crypto.subtle.digest('SHA-256', bodyBuffer);
        const actualDigest = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
        
        if (actualDigest !== expectedDigest) {
          console.error('Digest mismatch');
          return false;
        }
      }
    }

    // Build the signing string based on headers specified in signature
    const signedHeadersList = params.headers.split(' ');
    const signingStringParts: string[] = [];
    
    for (const header of signedHeadersList) {
      if (header === '(request-target)') {
        signingStringParts.push(`(request-target): ${method.toLowerCase()} ${url.pathname}`);
      } else if (header === 'host') {
        signingStringParts.push(`host: ${url.host}`);
      } else if (header === 'date') {
        signingStringParts.push(`date: ${dateHeader}`);
      } else if (header === 'digest') {
        if (digestHeader) {
          signingStringParts.push(`digest: ${digestHeader}`);
        }
      } else if (header === 'content-type') {
        signingStringParts.push(`content-type: application/activity+json`);
      }
    }
    
    const signingString = signingStringParts.join('\n');

    // Import the public key
    const pemContents = publicKeyPem
      .replace('-----BEGIN PUBLIC KEY-----', '')
      .replace('-----END PUBLIC KEY-----', '')
      .replace(/\n/g, '');
    
    const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
    
    const cryptoKey = await crypto.subtle.importKey(
      'spki',
      binaryKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Decode and verify signature
    const signatureBytes = Uint8Array.from(atob(params.signature), c => c.charCodeAt(0));
    
    const isValid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      signatureBytes,
      encoder.encode(signingString)
    );

    return isValid;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

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

    // Get required headers for signature verification
    const signatureHeader = req.headers.get('Signature');
    const dateHeader = req.headers.get('Date');
    const digestHeader = req.headers.get('Digest');

    // Clone request to read body multiple times
    const bodyText = await req.text();
    
    // Validate payload size
    const sizeValidation = validateJsonSize(bodyText);
    if (!sizeValidation.valid) {
      console.warn('[activitypub-inbox] Payload too large');
      return new Response(
        JSON.stringify({ error: 'Request payload too large' }),
        { status: 413, headers: corsHeaders }
      );
    }

    let activity;
    try {
      activity = JSON.parse(bodyText);
    } catch {
      console.warn('[activitypub-inbox] Invalid JSON payload');
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate activity structure
    const activityValidation = validateActivity(activity);
    if (!activityValidation.valid) {
      console.warn('[activitypub-inbox] Invalid activity:', activityValidation.error);
      return new Response(
        JSON.stringify({ error: 'Invalid activity format' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Require signature headers for authenticated ActivityPub requests
    if (!signatureHeader || !dateHeader) {
      console.warn('[activitypub-inbox] Missing required signature headers');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Log the activity for debugging (before verification)
    const activityLogId = activity.id || `${Date.now()}`;
    await supabase.from('federation_activities').insert({
      activity_id: activityLogId,
      activity_type: activity.type,
      actor_uri: activity.actor,
      object_uri: typeof activity.object === 'string' ? activity.object : activity.object?.id,
      target_uri: activity.target,
      raw_activity: activity,
      direction: 'incoming',
      status: 'pending',
    });

    // Fetch the remote actor to get their public key
    let remoteActor;
    try {
      remoteActor = await fetchRemoteActor(activity.actor, supabase);
    } catch (fetchError) {
      console.error('[activitypub-inbox] Failed to fetch remote actor:', fetchError);
      await supabase
        .from('federation_activities')
        .update({ 
          status: 'failed', 
          error_message: 'Failed to fetch remote actor for signature verification',
          processed_at: new Date().toISOString(),
        })
        .eq('activity_id', activityLogId);
      
      return new Response(
        JSON.stringify({ error: 'Unable to process request' }),
        { status: 502, headers: corsHeaders }
      );
    }

    // Verify the actor has a public key
    if (!remoteActor.public_key) {
      console.error('[activitypub-inbox] Remote actor has no public key');
      await supabase
        .from('federation_activities')
        .update({ 
          status: 'failed', 
          error_message: 'Remote actor has no public key',
          processed_at: new Date().toISOString(),
        })
        .eq('activity_id', activityLogId);
      
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Verify HTTP Signature
    const requestUrl = new URL(req.url);
    const isValidSignature = await verifyHttpSignature(
      req.method,
      requestUrl,
      signatureHeader,
      dateHeader,
      digestHeader,
      bodyText,
      remoteActor.public_key
    );

    if (!isValidSignature) {
      console.error('[activitypub-inbox] Invalid HTTP signature from:', activity.actor);
      await supabase
        .from('federation_activities')
        .update({ 
          status: 'failed', 
          error_message: 'Invalid HTTP signature',
          processed_at: new Date().toISOString(),
        })
        .eq('activity_id', activityLogId);
      
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: corsHeaders }
      );
    }

    console.log('Verified signature from:', activity.actor);

    // Process the activity (now verified)
    try {
      await processActivity(activity, supabase, instanceDomain);

      // Update activity status to processed
      await supabase
        .from('federation_activities')
        .update({ status: 'processed', processed_at: new Date().toISOString() })
        .eq('activity_id', activityLogId);
    } catch (processError) {
      console.error('Error processing activity:', processError);
      
      await supabase
        .from('federation_activities')
        .update({ 
          status: 'failed', 
          error_message: processError instanceof Error ? processError.message : 'Unknown error',
          processed_at: new Date().toISOString(),
        })
        .eq('activity_id', activityLogId);
    }

    // ActivityPub expects 202 Accepted for async processing
    return new Response(null, { status: 202, headers: corsHeaders });
  } catch (error) {
    // Log full error server-side for debugging
    console.error('[activitypub-inbox] Internal error:', error);
    // Return generic error to client
    return new Response(
      JSON.stringify({ error: 'Unable to process request' }),
      { status: 500, headers: corsHeaders }
    );
  }
});

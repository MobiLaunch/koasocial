import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.93.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

// Import crypto for signing
const encoder = new TextEncoder();

// Sign the request using HTTP Signatures
async function signRequest(
  method: string,
  url: URL,
  body: string,
  keyId: string,
  privateKeyPem: string
): Promise<Record<string, string>> {
  const date = new Date().toUTCString();
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(body));
  const digestBase64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  const digestHeader = `SHA-256=${digestBase64}`;

  // Build the signing string
  const signedHeaders = '(request-target) host date digest content-type';
  const signingString = [
    `(request-target): ${method.toLowerCase()} ${url.pathname}`,
    `host: ${url.host}`,
    `date: ${date}`,
    `digest: ${digestHeader}`,
    `content-type: application/activity+json`,
  ].join('\n');

  // Import the private key
  const pemContents = privateKeyPem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\n/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Sign
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(signingString)
  );
  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

  const signatureHeader = `keyId="${keyId}",algorithm="rsa-sha256",headers="${signedHeaders}",signature="${signatureBase64}"`;

  return {
    'Date': date,
    'Digest': digestHeader,
    'Signature': signatureHeader,
    'Content-Type': 'application/activity+json',
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const { remote_actor_id, action = 'follow' } = body;

    if (!remote_actor_id) {
      return new Response(
        JSON.stringify({ error: 'Missing remote_actor_id' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Get the user's keys
    const { data: keys, error: keysError } = await supabase
      .from('actor_keys')
      .select('*')
      .eq('profile_id', profile.id)
      .single();

    if (keysError || !keys) {
      return new Response(
        JSON.stringify({ error: 'Actor keys not found. Please refresh your profile.' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Get the remote actor
    const { data: remoteActor, error: remoteError } = await supabase
      .from('remote_actors')
      .select('*')
      .eq('id', remote_actor_id)
      .single();

    if (remoteError || !remoteActor) {
      return new Response(
        JSON.stringify({ error: 'Remote actor not found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    const instanceDomain = Deno.env.get('INSTANCE_DOMAIN') || 'koasocial.me';
    const baseUrl = `https://${instanceDomain}`;
    const actorId = `${baseUrl}/users/${profile.username}`;

    if (action === 'follow') {
      // Check if already following
      const { data: existingFollow } = await supabase
        .from('federation_follows')
        .select('id')
        .eq('local_profile_id', profile.id)
        .eq('remote_actor_id', remoteActor.id)
        .eq('direction', 'outgoing')
        .single();

      if (existingFollow) {
        return new Response(
          JSON.stringify({ error: 'Already following this user' }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Create Follow activity
      const followId = `${actorId}/follows/${crypto.randomUUID()}`;
      const followActivity = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        id: followId,
        type: 'Follow',
        actor: actorId,
        object: remoteActor.actor_uri,
      };

      const activityBody = JSON.stringify(followActivity);
      const inboxUrl = new URL(remoteActor.inbox_url);

      // Sign the request
      const signedHeaders = await signRequest(
        'POST',
        inboxUrl,
        activityBody,
        `${actorId}#main-key`,
        keys.private_key
      );

      // Send to remote inbox
      const response = await fetch(remoteActor.inbox_url, {
        method: 'POST',
        headers: {
          ...signedHeaders,
          'Accept': 'application/activity+json',
        },
        body: activityBody,
      });

      if (!response.ok && response.status !== 202) {
        const errorText = await response.text();
        console.error('Follow request failed:', response.status, errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to send follow request' }),
          { status: 502, headers: corsHeaders }
        );
      }

      // Record the follow locally
      await supabase.from('federation_follows').insert({
        local_profile_id: profile.id,
        remote_actor_id: remoteActor.id,
        direction: 'outgoing',
        status: 'pending',
      });

      // Log the activity
      await supabase.from('federation_activities').insert({
        activity_id: followId,
        activity_type: 'Follow',
        actor_uri: actorId,
        object_uri: remoteActor.actor_uri,
        raw_activity: followActivity,
        direction: 'outgoing',
        status: 'sent',
      });

      return new Response(
        JSON.stringify({ success: true, message: 'Follow request sent' }),
        { status: 200, headers: corsHeaders }
      );
    } else if (action === 'unfollow') {
      // Find the existing follow
      const { data: existingFollow } = await supabase
        .from('federation_follows')
        .select('id')
        .eq('local_profile_id', profile.id)
        .eq('remote_actor_id', remoteActor.id)
        .eq('direction', 'outgoing')
        .single();

      if (!existingFollow) {
        return new Response(
          JSON.stringify({ error: 'Not following this user' }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Create Undo Follow activity
      const undoId = `${actorId}/undos/${crypto.randomUUID()}`;
      const followId = `${actorId}/follows/${existingFollow.id}`;
      
      const undoActivity = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        id: undoId,
        type: 'Undo',
        actor: actorId,
        object: {
          id: followId,
          type: 'Follow',
          actor: actorId,
          object: remoteActor.actor_uri,
        },
      };

      const activityBody = JSON.stringify(undoActivity);
      const inboxUrl = new URL(remoteActor.inbox_url);

      // Sign the request
      const signedHeaders = await signRequest(
        'POST',
        inboxUrl,
        activityBody,
        `${actorId}#main-key`,
        keys.private_key
      );

      // Send to remote inbox
      const response = await fetch(remoteActor.inbox_url, {
        method: 'POST',
        headers: {
          ...signedHeaders,
          'Accept': 'application/activity+json',
        },
        body: activityBody,
      });

      if (!response.ok && response.status !== 202) {
        console.error('Unfollow request failed:', response.status);
      }

      // Remove the follow locally
      await supabase
        .from('federation_follows')
        .delete()
        .eq('id', existingFollow.id);

      // Log the activity
      await supabase.from('federation_activities').insert({
        activity_id: undoId,
        activity_type: 'Undo',
        actor_uri: actorId,
        object_uri: remoteActor.actor_uri,
        raw_activity: undoActivity,
        direction: 'outgoing',
        status: 'sent',
      });

      return new Response(
        JSON.stringify({ success: true, message: 'Unfollowed successfully' }),
        { status: 200, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Follow error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.93.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept',
  'Content-Type': 'application/activity+json',
};

// Generate RSA key pair for HTTP Signatures
async function generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify']
  );

  const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer))).match(/.{1,64}/g)?.join('\n')}\n-----END PUBLIC KEY-----`;
  const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${btoa(String.fromCharCode(...new Uint8Array(privateKeyBuffer))).match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----`;

  return { publicKey: publicKeyPem, privateKey: privateKeyPem };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Extract username from path: /activitypub-actor/username or /users/username
    let username = pathParts[pathParts.length - 1];
    
    // Also check query param as fallback
    if (!username || username === 'activitypub-actor') {
      username = url.searchParams.get('username') || '';
    }

    if (!username) {
      return new Response(
        JSON.stringify({ error: 'Missing username' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Get the base URL for this instance
    const instanceDomain = Deno.env.get('INSTANCE_DOMAIN') || 'koasocial.app';
    const baseUrl = `https://${instanceDomain}`;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up the user
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username.toLowerCase())
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Get or create keypair for this user
    let { data: keyData, error: keyError } = await supabase
      .from('actor_keys')
      .select('public_key')
      .eq('profile_id', profile.id)
      .single();

    if (!keyData) {
      // Generate new keypair
      const { publicKey, privateKey } = await generateKeyPair();
      
      const { data: newKey, error: insertError } = await supabase
        .from('actor_keys')
        .insert({
          profile_id: profile.id,
          public_key: publicKey,
          private_key: privateKey,
        })
        .select('public_key')
        .single();

      if (insertError) {
        console.error('Error creating keypair:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create actor keys' }),
          { status: 500, headers: corsHeaders }
        );
      }

      keyData = newKey;
    }

    const actorId = `${baseUrl}/users/${profile.username}`;

    // Build ActivityPub Actor object
    const actor = {
      '@context': [
        'https://www.w3.org/ns/activitystreams',
        'https://w3id.org/security/v1',
        {
          manuallyApprovesFollowers: 'as:manuallyApprovesFollowers',
          toot: 'http://joinmastodon.org/ns#',
          featured: {
            '@id': 'toot:featured',
            '@type': '@id',
          },
          discoverable: 'toot:discoverable',
        },
      ],
      id: actorId,
      type: 'Person',
      following: `${actorId}/following`,
      followers: `${actorId}/followers`,
      inbox: `${actorId}/inbox`,
      outbox: `${actorId}/outbox`,
      featured: `${actorId}/collections/featured`,
      preferredUsername: profile.username,
      name: profile.display_name,
      summary: profile.bio || '',
      url: `${baseUrl}/@${profile.username}`,
      manuallyApprovesFollowers: false,
      discoverable: true,
      published: profile.created_at,
      publicKey: {
        id: `${actorId}#main-key`,
        owner: actorId,
        publicKeyPem: keyData!.public_key,
      },
      icon: profile.avatar_url ? {
        type: 'Image',
        mediaType: 'image/jpeg',
        url: profile.avatar_url,
      } : undefined,
      image: profile.banner_url ? {
        type: 'Image',
        mediaType: 'image/jpeg',
        url: profile.banner_url,
      } : undefined,
      endpoints: {
        sharedInbox: `${baseUrl}/inbox`,
      },
    };

    // Remove undefined fields
    const cleanActor = JSON.parse(JSON.stringify(actor));

    return new Response(JSON.stringify(cleanActor), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('ActivityPub actor error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});

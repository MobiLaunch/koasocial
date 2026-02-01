import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.93.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/jrd+json',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const resource = url.searchParams.get('resource');

    if (!resource) {
      return new Response(
        JSON.stringify({ error: 'Missing resource parameter' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Parse acct:username@domain format
    const acctMatch = resource.match(/^acct:([^@]+)@(.+)$/);
    if (!acctMatch) {
      return new Response(
        JSON.stringify({ error: 'Invalid resource format. Expected acct:user@domain' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const [, username, domain] = acctMatch;

    // Get the base URL for this instance
    const instanceDomain = Deno.env.get('INSTANCE_DOMAIN') || domain;
    const baseUrl = `https://${instanceDomain}`;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Look up the user
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .eq('username', username.toLowerCase())
      .single();

    if (error || !profile) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Build WebFinger response
    const webfingerResponse = {
      subject: `acct:${profile.username}@${instanceDomain}`,
      aliases: [
        `${baseUrl}/users/${profile.username}`,
        `${baseUrl}/@${profile.username}`,
      ],
      links: [
        {
          rel: 'http://webfinger.net/rel/profile-page',
          type: 'text/html',
          href: `${baseUrl}/@${profile.username}`,
        },
        {
          rel: 'self',
          type: 'application/activity+json',
          href: `${baseUrl}/users/${profile.username}`,
        },
        {
          rel: 'http://ostatus.org/schema/1.0/subscribe',
          template: `${baseUrl}/authorize_interaction?uri={uri}`,
        },
      ],
    };

    return new Response(JSON.stringify(webfingerResponse), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('WebFinger error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});

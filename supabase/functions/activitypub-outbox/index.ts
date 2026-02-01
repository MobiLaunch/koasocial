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
    
    // Extract username from path
    let username = url.searchParams.get('username') || '';
    
    // Try to extract from path like /activitypub-outbox/username
    if (!username && pathParts.length > 1) {
      username = pathParts[pathParts.length - 1];
    }

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

    // Get pagination params
    const page = url.searchParams.get('page');
    const minId = url.searchParams.get('min_id');
    const maxId = url.searchParams.get('max_id');

    const actorId = `${baseUrl}/users/${profile.username}`;
    const outboxUrl = `${actorId}/outbox`;

    // If no page param, return the collection summary
    if (!page) {
      // Get total post count
      const { count } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('author_id', profile.id)
        .in('visibility', ['public', 'unlisted']);

      const outboxCollection = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        id: outboxUrl,
        type: 'OrderedCollection',
        totalItems: count || 0,
        first: `${outboxUrl}?page=true`,
        last: `${outboxUrl}?page=true&min_id=0`,
      };

      return new Response(JSON.stringify(outboxCollection), {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Get paginated posts
    let query = supabase
      .from('posts')
      .select('*')
      .eq('author_id', profile.id)
      .in('visibility', ['public', 'unlisted'])
      .order('created_at', { ascending: false })
      .limit(20);

    if (maxId) {
      query = query.lt('id', maxId);
    }
    if (minId) {
      query = query.gt('id', minId);
    }

    const { data: posts, error: postsError } = await query;

    if (postsError) {
      throw postsError;
    }

    // Convert posts to ActivityPub Create activities
    const orderedItems = (posts || []).map((post) => {
      const noteId = `${baseUrl}/posts/${post.id}`;
      
      return {
        id: `${noteId}/activity`,
        type: 'Create',
        actor: actorId,
        published: post.created_at,
        to: post.visibility === 'public' 
          ? ['https://www.w3.org/ns/activitystreams#Public']
          : [`${actorId}/followers`],
        cc: post.visibility === 'public' 
          ? [`${actorId}/followers`]
          : [],
        object: {
          id: noteId,
          type: 'Note',
          summary: null,
          inReplyTo: post.reply_to_id ? `${baseUrl}/posts/${post.reply_to_id}` : null,
          published: post.created_at,
          url: noteId,
          attributedTo: actorId,
          to: post.visibility === 'public' 
            ? ['https://www.w3.org/ns/activitystreams#Public']
            : [`${actorId}/followers`],
          cc: post.visibility === 'public' 
            ? [`${actorId}/followers`]
            : [],
          sensitive: false,
          content: post.content,
          contentMap: {
            en: post.content,
          },
          attachment: [],
          tag: [],
          replies: {
            id: `${noteId}/replies`,
            type: 'Collection',
            first: {
              type: 'CollectionPage',
              next: `${noteId}/replies?page=true`,
              partOf: `${noteId}/replies`,
              items: [],
            },
          },
        },
      };
    });

    const outboxPage = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: `${outboxUrl}?page=true`,
      type: 'OrderedCollectionPage',
      partOf: outboxUrl,
      orderedItems,
    };

    // Add next/prev links if applicable
    if (posts && posts.length > 0) {
      const lastPost = posts[posts.length - 1];
      const firstPost = posts[0];
      (outboxPage as any).next = `${outboxUrl}?page=true&max_id=${lastPost.id}`;
      (outboxPage as any).prev = `${outboxUrl}?page=true&min_id=${firstPost.id}`;
    }

    return new Response(JSON.stringify(outboxPage), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Outbox error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});

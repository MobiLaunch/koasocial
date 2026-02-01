import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.93.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

// Popular Fediverse instances to fetch trending posts from
const INSTANCES = [
  'mastodon.social',
  'hachyderm.io',
  'fosstodon.org',
];

interface MastodonStatus {
  id: string;
  created_at: string;
  url: string;
  content: string;
  reblogs_count: number;
  favourites_count: number;
  replies_count: number;
  account: {
    id: string;
    username: string;
    acct: string;
    display_name: string;
    avatar: string;
    url: string;
  };
  media_attachments: Array<{
    type: string;
    url: string;
    preview_url: string;
  }>;
}

interface TrendingPost {
  id: string;
  instance: string;
  url: string;
  content: string;
  created_at: string;
  reblogs_count: number;
  favourites_count: number;
  replies_count: number;
  author: {
    username: string;
    acct: string;
    display_name: string;
    avatar: string;
    url: string;
  };
  media: Array<{
    type: string;
    url: string;
    preview_url: string;
  }>;
}

async function fetchTrendingFromInstance(instance: string): Promise<TrendingPost[]> {
  try {
    const response = await fetch(`https://${instance}/api/v1/trends/statuses?limit=5`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch from ${instance}: ${response.status}`);
      return [];
    }

    const statuses: MastodonStatus[] = await response.json();

    return statuses.map((status) => ({
      id: `${instance}:${status.id}`,
      instance,
      url: status.url,
      content: status.content,
      created_at: status.created_at,
      reblogs_count: status.reblogs_count,
      favourites_count: status.favourites_count,
      replies_count: status.replies_count,
      author: {
        username: status.account.username,
        acct: status.account.acct.includes('@') 
          ? status.account.acct 
          : `${status.account.acct}@${instance}`,
        display_name: status.account.display_name || status.account.username,
        avatar: status.account.avatar,
        url: status.account.url,
      },
      media: status.media_attachments.map((m) => ({
        type: m.type,
        url: m.url,
        preview_url: m.preview_url,
      })),
    }));
  } catch (error) {
    console.error(`Error fetching from ${instance}:`, error);
    return [];
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Fetch trending posts from all instances in parallel
    const results = await Promise.all(
      INSTANCES.map((instance) => fetchTrendingFromInstance(instance))
    );

    // Flatten and sort by engagement (favorites + boosts)
    const allPosts = results.flat();
    allPosts.sort((a, b) => {
      const engagementA = a.favourites_count + a.reblogs_count;
      const engagementB = b.favourites_count + b.reblogs_count;
      return engagementB - engagementA;
    });

    // Return top 10 posts
    const trendingPosts = allPosts.slice(0, 10);

    return new Response(
      JSON.stringify({
        success: true,
        posts: trendingPosts,
        fetched_at: new Date().toISOString(),
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error fetching trending posts:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch trending posts' }),
      { status: 500, headers: corsHeaders }
    );
  }
});

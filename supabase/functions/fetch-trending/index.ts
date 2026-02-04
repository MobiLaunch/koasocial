import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.93.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

// Popular Mastodon instances to fetch trending posts from
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

interface MastodonTag {
  name: string;
  url: string;
  history: Array<{
    day: string;
    uses: string;
    accounts: string;
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

interface TrendingTag {
  name: string;
  url: string;
  instance: string;
  uses_today: number;
  accounts_today: number;
}

async function fetchTrendingFromInstance(instance: string): Promise<TrendingPost[]> {
  try {
    const response = await fetch(`https://${instance}/api/v1/trends/statuses?limit=5`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch posts from ${instance}: ${response.status}`);
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
    console.error(`Error fetching posts from ${instance}:`, error);
    return [];
  }
}

async function fetchTagsFromInstance(instance: string): Promise<TrendingTag[]> {
  try {
    const response = await fetch(`https://${instance}/api/v1/trends/tags?limit=10`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch tags from ${instance}: ${response.status}`);
      return [];
    }

    const tags: MastodonTag[] = await response.json();

    return tags.map((tag) => {
      // Get today's stats (first entry in history)
      const todayStats = tag.history[0] || { uses: '0', accounts: '0' };
      
      return {
        name: tag.name,
        url: tag.url,
        instance,
        uses_today: parseInt(todayStats.uses, 10),
        accounts_today: parseInt(todayStats.accounts, 10),
      };
    });
  } catch (error) {
    console.error(`Error fetching tags from ${instance}:`, error);
    return [];
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Fetch trending posts and tags from all instances in parallel
    const [postsResults, tagsResults] = await Promise.all([
      Promise.all(INSTANCES.map((instance) => fetchTrendingFromInstance(instance))),
      Promise.all(INSTANCES.map((instance) => fetchTagsFromInstance(instance))),
    ]);

    // Flatten and sort posts by engagement (favorites + boosts)
    const allPosts = postsResults.flat();
    allPosts.sort((a, b) => {
      const engagementA = a.favourites_count + a.reblogs_count;
      const engagementB = b.favourites_count + b.reblogs_count;
      return engagementB - engagementA;
    });

    // Flatten tags and deduplicate by name, keeping highest usage
    const tagMap = new Map<string, TrendingTag>();
    for (const tag of tagsResults.flat()) {
      const existing = tagMap.get(tag.name.toLowerCase());
      if (!existing || tag.uses_today > existing.uses_today) {
        tagMap.set(tag.name.toLowerCase(), tag);
      }
    }
    
    // Sort tags by usage
    const allTags = Array.from(tagMap.values());
    allTags.sort((a, b) => b.uses_today - a.uses_today);

    // Return top results
    const trendingPosts = allPosts.slice(0, 10);
    const trendingTags = allTags.slice(0, 10);

    return new Response(
      JSON.stringify({
        success: true,
        posts: trendingPosts,
        tags: trendingTags,
        fetched_at: new Date().toISOString(),
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error fetching trending:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch trending' }),
      { status: 500, headers: corsHeaders }
    );
  }
});

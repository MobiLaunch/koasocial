const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

// News source metadata with bias and credibility ratings
// Based on Media Bias/Fact Check and Ad Fontes Media ratings
const NEWS_SOURCES: Record<string, {
  name: string;
  bias: 'left' | 'left-center' | 'center' | 'right-center' | 'right';
  biasLabel: string;
  credibility: 'high' | 'mostly-factual' | 'mixed' | 'low';
  credibilityScore: number; // 0-100
  rssUrl: string;
  category: 'world' | 'finance' | 'breaking' | 'general';
}> = {
  'reuters': {
    name: 'Reuters',
    bias: 'center',
    biasLabel: 'Center',
    credibility: 'high',
    credibilityScore: 95,
    rssUrl: 'https://www.reutersagency.com/feed/?best-topics=world&post_type=best',
    category: 'world',
  },
  'ap': {
    name: 'Associated Press',
    bias: 'center',
    biasLabel: 'Center',
    credibility: 'high',
    credibilityScore: 94,
    rssUrl: 'https://feedx.net/rss/ap.xml',
    category: 'world',
  },
  'bbc': {
    name: 'BBC News',
    bias: 'left-center',
    biasLabel: 'Left-Center',
    credibility: 'high',
    credibilityScore: 90,
    rssUrl: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    category: 'world',
  },
  'npr': {
    name: 'NPR',
    bias: 'left-center',
    biasLabel: 'Left-Center',
    credibility: 'high',
    credibilityScore: 88,
    rssUrl: 'https://feeds.npr.org/1001/rss.xml',
    category: 'general',
  },
  'wsj': {
    name: 'Wall Street Journal',
    bias: 'right-center',
    biasLabel: 'Right-Center',
    credibility: 'mostly-factual',
    credibilityScore: 85,
    rssUrl: 'https://feeds.a].',
    category: 'finance',
  },
  'guardian': {
    name: 'The Guardian',
    bias: 'left-center',
    biasLabel: 'Left-Center',
    credibility: 'mostly-factual',
    credibilityScore: 82,
    rssUrl: 'https://www.theguardian.com/world/rss',
    category: 'world',
  },
  'cnbc': {
    name: 'CNBC',
    bias: 'center',
    biasLabel: 'Center',
    credibility: 'mostly-factual',
    credibilityScore: 80,
    rssUrl: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114',
    category: 'finance',
  },
  'aljazeera': {
    name: 'Al Jazeera',
    bias: 'left-center',
    biasLabel: 'Left-Center',
    credibility: 'mostly-factual',
    credibilityScore: 78,
    rssUrl: 'https://www.aljazeera.com/xml/rss/all.xml',
    category: 'world',
  },
};

interface NewsItem {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: {
    id: string;
    name: string;
    bias: string;
    biasLabel: string;
    credibility: string;
    credibilityScore: number;
  };
  category: string;
}

// Simple XML parser for RSS feeds
function parseRSSItem(itemXml: string): { title: string; description: string; link: string; pubDate: string } | null {
  try {
    const getTagContent = (xml: string, tag: string): string => {
      // Handle CDATA sections
      const cdataMatch = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i'));
      if (cdataMatch) return cdataMatch[1].trim();
      
      const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
      return match ? match[1].trim() : '';
    };

    const title = getTagContent(itemXml, 'title');
    const description = getTagContent(itemXml, 'description') || getTagContent(itemXml, 'summary');
    const link = getTagContent(itemXml, 'link') || itemXml.match(/<link[^>]*href="([^"]+)"/i)?.[1] || '';
    const pubDate = getTagContent(itemXml, 'pubDate') || getTagContent(itemXml, 'published') || getTagContent(itemXml, 'updated');

    if (!title || !link) return null;

    // Strip HTML tags from description
    const cleanDescription = description.replace(/<[^>]*>/g, '').substring(0, 300);

    return { title, description: cleanDescription, link, pubDate };
  } catch {
    return null;
  }
}

async function fetchFromSource(sourceId: string, source: typeof NEWS_SOURCES[string]): Promise<NewsItem[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(source.rssUrl, {
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml',
        'User-Agent': 'KoaSocial/1.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Failed to fetch from ${source.name}: ${response.status}`);
      return [];
    }

    const xml = await response.text();
    
    // Extract items from RSS feed
    const itemMatches = xml.match(/<item[\s\S]*?<\/item>/gi) || xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
    
    const items: NewsItem[] = [];
    
    for (const itemXml of itemMatches.slice(0, 5)) {
      const parsed = parseRSSItem(itemXml);
      if (parsed) {
        items.push({
          id: `${sourceId}:${btoa(parsed.link).substring(0, 20)}`,
          title: parsed.title,
          description: parsed.description,
          link: parsed.link,
          pubDate: parsed.pubDate,
          source: {
            id: sourceId,
            name: source.name,
            bias: source.bias,
            biasLabel: source.biasLabel,
            credibility: source.credibility,
            credibilityScore: source.credibilityScore,
          },
          category: source.category,
        });
      }
    }

    return items;
  } catch (error) {
    console.error(`Error fetching from ${source.name}:`, error);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category') || 'all';

    // Filter sources by category if specified
    const sourcesToFetch = Object.entries(NEWS_SOURCES).filter(([_, source]) => 
      category === 'all' || source.category === category
    );

    // Fetch from all sources in parallel
    const results = await Promise.all(
      sourcesToFetch.map(([id, source]) => fetchFromSource(id, source))
    );

    // Flatten and sort by date (newest first)
    const allNews = results.flat();
    allNews.sort((a, b) => {
      const dateA = new Date(a.pubDate).getTime() || 0;
      const dateB = new Date(b.pubDate).getTime() || 0;
      return dateB - dateA;
    });

    // Group by category
    const grouped = {
      world: allNews.filter(n => n.category === 'world').slice(0, 10),
      finance: allNews.filter(n => n.category === 'finance').slice(0, 10),
      breaking: allNews.filter(n => n.category === 'breaking').slice(0, 5),
      general: allNews.filter(n => n.category === 'general').slice(0, 10),
    };

    return new Response(
      JSON.stringify({
        success: true,
        news: category === 'all' ? allNews.slice(0, 30) : allNews,
        grouped,
        sources: Object.entries(NEWS_SOURCES).map(([id, s]) => ({
          id,
          name: s.name,
          bias: s.bias,
          biasLabel: s.biasLabel,
          credibility: s.credibility,
          credibilityScore: s.credibilityScore,
        })),
        fetched_at: new Date().toISOString(),
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error fetching news:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch news' }),
      { status: 500, headers: corsHeaders }
    );
  }
});

import { useState, useEffect, forwardRef } from 'react';
import { Newspaper, TrendingUp, Globe, DollarSign, AlertCircle, ExternalLink, Shield, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';

interface NewsSource {
  id: string;
  name: string;
  bias: string;
  biasLabel: string;
  credibility: string;
  credibilityScore: number;
}

interface NewsItem {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: NewsSource;
  category: string;
}

interface NewsResponse {
  success: boolean;
  news: NewsItem[];
  grouped: {
    world: NewsItem[];
    finance: NewsItem[];
    breaking: NewsItem[];
    general: NewsItem[];
  };
  sources: NewsSource[];
  fetched_at: string;
}

const biasColors: Record<string, string> = {
  'left': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'left-center': 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  'center': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'right-center': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'right': 'bg-red-500/20 text-red-400 border-red-500/30',
};

const credibilityColors: Record<string, string> = {
  'high': 'text-emerald-400',
  'mostly-factual': 'text-lime-400',
  'mixed': 'text-amber-400',
  'low': 'text-red-400',
};

function formatTimeAgo(dateString: string): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

// Clean text from HTML entities and encoding issues
function cleanText(text: string): string {
  if (!text) return '';
  
  // Decode HTML entities
  const textarea = typeof document !== 'undefined' ? document.createElement('textarea') : null;
  if (textarea) {
    textarea.innerHTML = text;
    text = textarea.value;
  }
  
  // Remove any remaining HTML tags
  text = text.replace(/<[^>]*>/g, '');
  
  // Fix common encoding issues
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  return text;
}

const CredibilityMeterContent = forwardRef<HTMLDivElement, { score: number; credibility: string }>(
  ({ score, credibility }, ref) => (
    <div ref={ref} className="flex items-center gap-1.5 cursor-help shrink-0">
      <Shield className={`h-3.5 w-3.5 shrink-0 ${credibilityColors[credibility]}`} />
      <div className="w-10 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
        <div 
          className={`h-full rounded-full ${
            score >= 85 ? 'bg-emerald-500' : 
            score >= 70 ? 'bg-lime-500' : 
            score >= 50 ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground shrink-0">{score}</span>
    </div>
  )
);
CredibilityMeterContent.displayName = 'CredibilityMeterContent';

function CredibilityMeter({ score, credibility }: { score: number; credibility: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <CredibilityMeterContent score={score} credibility={credibility} />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-medium">Truthmeter: {score}/100</p>
          <p className="text-xs text-muted-foreground">
            Based on Media Bias/Fact Check ratings. Higher scores indicate more factual reporting.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function BiasLabel({ bias, biasLabel }: { bias: string; biasLabel: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${biasColors[bias]}`}>
              {biasLabel}
            </Badge>
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-medium">Political Bias: {biasLabel}</p>
          <p className="text-xs text-muted-foreground">
            Rating based on Media Bias/Fact Check. Center sources show minimal political bias.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  const cleanTitle = cleanText(item.title);
  const cleanDescription = cleanText(item.description);
  
  return (
    <a 
      href={item.link} 
      target="_blank" 
      rel="noopener noreferrer"
      className="block p-3 rounded-lg hover:bg-accent/50 transition-colors border border-transparent hover:border-border overflow-hidden"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className="text-xs font-medium text-primary shrink-0">{item.source.name}</span>
          <BiasLabel bias={item.source.bias} biasLabel={item.source.biasLabel} />
          <CredibilityMeter score={item.source.credibilityScore} credibility={item.source.credibility} />
        </div>
        <div className="flex items-center gap-1 text-muted-foreground shrink-0">
          <span className="text-[10px]">{formatTimeAgo(item.pubDate)}</span>
          <ExternalLink className="h-3 w-3" />
        </div>
      </div>
      <h4 className="font-medium text-sm leading-snug mb-1 line-clamp-2 break-words">
        {cleanTitle}
      </h4>
      {cleanDescription && (
        <p className="text-xs text-muted-foreground line-clamp-2 break-words">
          {cleanDescription}
        </p>
      )}
    </a>
  );
}

export function TrendingNews() {
  const [news, setNews] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    async function fetchNews() {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase.functions.invoke('fetch-news');
        
        if (fetchError) throw fetchError;
        if (!data?.success) throw new Error(data?.error || 'Failed to fetch news');
        
        setNews(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Unable to load trending news');
      } finally {
        setLoading(false);
      }
    }

    fetchNews();
    // Refresh every 5 minutes
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Newspaper className="h-4 w-4" />
            Trending News
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !news) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Newspaper className="h-4 w-4" />
            Trending News
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6 text-muted-foreground">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const getNewsForTab = () => {
    switch (activeTab) {
      case 'world': return news.grouped.world;
      case 'finance': return news.grouped.finance;
      case 'general': return news.grouped.general;
      default: return news.news;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Trending News
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Sources rated for bias & factual accuracy
        </p>
      </CardHeader>
      <CardContent className="pt-0 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full h-8 mb-2">
            <TabsTrigger value="all" className="flex-1 text-xs gap-1 h-7">
              <Newspaper className="h-3 w-3" />
              All
            </TabsTrigger>
            <TabsTrigger value="world" className="flex-1 text-xs gap-1 h-7">
              <Globe className="h-3 w-3" />
              World
            </TabsTrigger>
            <TabsTrigger value="finance" className="flex-1 text-xs gap-1 h-7">
              <DollarSign className="h-3 w-3" />
              Finance
            </TabsTrigger>
          </TabsList>

          <div className="space-y-1 max-h-[400px] overflow-y-auto overflow-x-hidden">
            {getNewsForTab().length > 0 ? (
              getNewsForTab().map((item) => (
                <NewsCard key={item.id} item={item} />
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">
                No news available
              </p>
            )}
          </div>
        </Tabs>

        {/* Legend */}
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-[10px] text-muted-foreground mb-2">Bias Scale:</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(biasColors).map(([bias, colors]) => (
              <span key={bias}>
                <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${colors}`}>
                  {bias.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-')}
                </Badge>
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

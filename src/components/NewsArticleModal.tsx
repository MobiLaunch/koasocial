import { ExternalLink, Shield, X, Share2, Bookmark } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

interface NewsArticleModalProps {
  article: NewsItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const biasColors: Record<string, string> = {
  'left': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'left-center': 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  'center': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'right-center': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'right': 'bg-red-500/20 text-red-400 border-red-500/30',
};

const credibilityColors: Record<string, { bg: string; text: string }> = {
  'high': { bg: 'bg-emerald-500', text: 'text-emerald-500' },
  'mostly-factual': { bg: 'bg-lime-500', text: 'text-lime-500' },
  'mixed': { bg: 'bg-amber-500', text: 'text-amber-500' },
  'low': { bg: 'bg-red-500', text: 'text-red-500' },
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

  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
}

function cleanText(text: string): string {
  if (!text) return '';
  if (typeof document !== 'undefined' && typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      text = doc.body.textContent || '';
    } catch {
      text = text.replace(/<[^>]*>/g, '');
    }
  } else {
    text = text.replace(/<[^>]*>/g, '');
  }
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function NewsArticleModal({ article, isOpen, onClose }: NewsArticleModalProps) {
  if (!article) return null;

  const credColor = credibilityColors[article.source.credibility] || credibilityColors['mixed'];
  const cleanTitle = cleanText(article.title);
  const cleanDescription = cleanText(article.description);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl rounded-3xl p-0 gap-0 overflow-hidden">
        {/* Trust Score Header */}
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-5 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className={`h-5 w-5 ${credColor.text}`} />
              <span className="font-semibold">Truthmeter</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${credColor.text}`}>
                {article.source.credibilityScore}
              </span>
              <span className="text-muted-foreground">/100</span>
            </div>
          </div>
          
          {/* Progress bar */}
          <Progress 
            value={article.source.credibilityScore} 
            className="h-2.5 rounded-full"
          />
          
          {/* Bias indicator */}
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-muted-foreground">Political Bias</span>
            <Badge 
              variant="outline" 
              className={`${biasColors[article.source.bias]} font-semibold`}
            >
              {article.source.biasLabel}
            </Badge>
          </div>
        </div>

        {/* Article Content */}
        <div className="p-6 space-y-4">
          {/* Source */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">
                {article.source.name.charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-semibold text-sm">{article.source.name}</p>
              <p className="text-xs text-muted-foreground">{formatTimeAgo(article.pubDate)}</p>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold leading-tight">
            {cleanTitle}
          </h2>

          {/* Description */}
          {cleanDescription && (
            <p className="text-muted-foreground leading-relaxed">
              {cleanDescription}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button 
              className="flex-1 gap-2 rounded-xl h-12 koa-gradient text-primary-foreground"
              onClick={() => window.open(article.link, '_blank', 'noopener,noreferrer')}
            >
              <ExternalLink className="h-4 w-4" />
              Read Full Article
            </Button>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl">
                    <Bookmark className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save for later</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Footer disclaimer */}
        <div className="px-6 pb-5">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            Credibility ratings based on Media Bias/Fact Check. 
            Always verify important news from multiple sources.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

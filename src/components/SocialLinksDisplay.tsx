import { ExternalLink } from 'lucide-react';
import { SOCIAL_PLATFORMS } from './SocialLinksEditor';
import { cn } from '@/lib/utils';

interface SocialLinksDisplayProps {
  links: Record<string, string>;
  className?: string;
  compact?: boolean;
}

export function SocialLinksDisplay({ links, className, compact = false }: SocialLinksDisplayProps) {
  const platformIds = Object.keys(links);
  
  if (platformIds.length === 0) return null;

  const getPlatformInfo = (platformId: string) => {
    return SOCIAL_PLATFORMS.find(p => p.id === platformId);
  };

  if (compact) {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {platformIds.map((platformId) => {
          const platform = getPlatformInfo(platformId);
          const url = links[platformId];
          return (
            <a
              key={platformId}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent/30 hover:bg-accent/50 rounded-full text-sm transition-colors group"
              title={platform?.name || platformId}
            >
              <span>{platform?.icon || '🔗'}</span>
              <span className="hidden sm:inline text-muted-foreground group-hover:text-foreground transition-colors">
                {platform?.name || platformId}
              </span>
            </a>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {platformIds.map((platformId) => {
        const platform = getPlatformInfo(platformId);
        const url = links[platformId];
        // Extract display name from URL
        let displayName = url;
        try {
          const urlObj = new URL(url);
          displayName = urlObj.pathname.replace(/^\/+/, '').replace(/\/+$/, '') || urlObj.hostname;
        } catch {
          // Keep original if URL parsing fails
        }

        return (
          <a
            key={platformId}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-accent/20 hover:bg-accent/40 rounded-xl transition-colors group"
          >
            <span className="text-xl">{platform?.icon || '🔗'}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{platform?.name || platformId}</p>
              <p className="text-xs text-muted-foreground truncate">{displayName}</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </a>
        );
      })}
    </div>
  );
}

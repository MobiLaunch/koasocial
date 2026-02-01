import { useState } from 'react';
import { X, Plus, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface SocialLink {
  platform: string;
  url: string;
}

export const SOCIAL_PLATFORMS = [
  { id: 'threads', name: 'Threads', icon: '🧵', urlPrefix: 'https://threads.net/@' },
  { id: 'bluesky', name: 'Bluesky', icon: '🦋', urlPrefix: 'https://bsky.app/profile/' },
  { id: 'instagram', name: 'Instagram', icon: '📸', urlPrefix: 'https://instagram.com/' },
  { id: 'facebook', name: 'Facebook', icon: '👥', urlPrefix: 'https://facebook.com/' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', urlPrefix: 'https://tiktok.com/@' },
  { id: 'snapchat', name: 'Snapchat', icon: '👻', urlPrefix: 'https://snapchat.com/add/' },
  { id: 'twitter', name: 'X (Twitter)', icon: '𝕏', urlPrefix: 'https://x.com/' },
  { id: 'youtube', name: 'YouTube', icon: '📺', urlPrefix: 'https://youtube.com/@' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', urlPrefix: 'https://linkedin.com/in/' },
  { id: 'substack', name: 'Substack', icon: '📰', urlPrefix: 'https://' },
  { id: 'github', name: 'GitHub', icon: '🐙', urlPrefix: 'https://github.com/' },
  { id: 'mastodon', name: 'Mastodon', icon: '🐘', urlPrefix: '' },
  { id: 'website', name: 'Website', icon: '🌐', urlPrefix: '' },
] as const;

interface SocialLinksEditorProps {
  links: Record<string, string>;
  onChange: (links: Record<string, string>) => void;
  maxLinks?: number;
}

export function SocialLinksEditor({ links, onChange, maxLinks = 5 }: SocialLinksEditorProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [inputValue, setInputValue] = useState('');

  const existingPlatforms = Object.keys(links);
  const availablePlatforms = SOCIAL_PLATFORMS.filter(p => !existingPlatforms.includes(p.id));

  const handleAddLink = () => {
    if (!selectedPlatform || !inputValue.trim()) return;
    
    const platform = SOCIAL_PLATFORMS.find(p => p.id === selectedPlatform);
    if (!platform) return;

    let url = inputValue.trim();
    // If the input doesn't start with http, construct the URL
    if (!url.startsWith('http')) {
      url = platform.urlPrefix + url.replace(/^@/, '');
    }

    onChange({ ...links, [selectedPlatform]: url });
    setSelectedPlatform('');
    setInputValue('');
  };

  const handleRemoveLink = (platform: string) => {
    const newLinks = { ...links };
    delete newLinks[platform];
    onChange(newLinks);
  };

  const getPlatformInfo = (platformId: string) => {
    return SOCIAL_PLATFORMS.find(p => p.id === platformId);
  };

  return (
    <div className="space-y-4">
      {/* Existing links */}
      {existingPlatforms.length > 0 && (
        <div className="space-y-2">
          {existingPlatforms.map((platformId) => {
            const platform = getPlatformInfo(platformId);
            const url = links[platformId];
            return (
              <div
                key={platformId}
                className="flex items-center gap-2 p-3 bg-accent/30 rounded-xl"
              >
                <span className="text-lg">{platform?.icon || '🔗'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{platform?.name || platformId}</p>
                  <p className="text-xs text-muted-foreground truncate">{url}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleRemoveLink(platformId)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add new link */}
      {existingPlatforms.length < maxLinks && availablePlatforms.length > 0 && (
        <div className="space-y-3 p-4 border border-dashed border-border rounded-xl">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            Add social link
          </Label>
          
          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger className="rounded-xl bg-accent/30 border-transparent">
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent>
              {availablePlatforms.map((platform) => (
                <SelectItem key={platform.id} value={platform.id}>
                  <span className="flex items-center gap-2">
                    <span>{platform.icon}</span>
                    <span>{platform.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedPlatform && (
            <>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  selectedPlatform === 'website' || selectedPlatform === 'mastodon' || selectedPlatform === 'substack'
                    ? 'Full URL (https://...)'
                    : 'Username or profile URL'
                }
                className="rounded-xl bg-accent/30 border-transparent focus:border-primary/50"
              />
              <Button
                type="button"
                onClick={handleAddLink}
                disabled={!inputValue.trim()}
                className="w-full rounded-xl koa-gradient text-primary-foreground"
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Add link
              </Button>
            </>
          )}
        </div>
      )}

      {existingPlatforms.length >= maxLinks && (
        <p className="text-xs text-muted-foreground text-center">
          Maximum of {maxLinks} social links reached
        </p>
      )}
    </div>
  );
}

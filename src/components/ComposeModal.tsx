import { useState } from 'react';
import { Globe, Users, Lock, Mail, Smile, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { createPost } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type Visibility = 'public' | 'unlisted' | 'followers' | 'direct';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
}

const MAX_CHARS = 500;

const visibilityOptions = [
  { value: 'public' as Visibility, label: 'Public', icon: Globe, description: 'Visible to everyone' },
  { value: 'unlisted' as Visibility, label: 'Unlisted', icon: Globe, description: 'Visible but not on public timelines' },
  { value: 'followers' as Visibility, label: 'Followers only', icon: Users, description: 'Only visible to followers' },
  { value: 'direct' as Visibility, label: 'Direct', icon: Mail, description: 'Only visible to mentioned users' },
];

export function ComposeModal({ isOpen, onClose, onPostCreated }: ComposeModalProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [isPosting, setIsPosting] = useState(false);

  const charsRemaining = MAX_CHARS - content.length;
  const isOverLimit = charsRemaining < 0;
  const isEmpty = content.trim().length === 0;

  const handlePost = async () => {
    if (isEmpty || isOverLimit || !profile) return;

    setIsPosting(true);
    try {
      await createPost(profile.id, content, visibility);
      toast({ title: 'Posted!', description: 'Your post is now live.' });
      setContent('');
      onPostCreated?.();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create post',
        variant: 'destructive',
      });
    } finally {
      setIsPosting(false);
    }
  };

  const selectedVisibility = visibilityOptions.find(v => v.value === visibility)!;
  const VisibilityIcon = selectedVisibility.icon;

  if (!profile) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 rounded-2xl">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="font-display">Compose</DialogTitle>
        </DialogHeader>

        <div className="p-4">
          <div className="flex gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-background">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {profile.display_name.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <Textarea
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[120px] border-0 p-0 resize-none focus-visible:ring-0 text-base placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border-t bg-muted/30">
          <div className="flex items-center gap-2">
            {/* Emoji picker placeholder */}
            <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10">
              <Smile className="h-5 w-5" />
            </Button>

            {/* Visibility selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-primary hover:bg-primary/10">
                  <VisibilityIcon className="h-4 w-4" />
                  <span>{selectedVisibility.label}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {visibilityOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onClick={() => setVisibility(option.value)}
                    className="flex items-start gap-3 py-2"
                  >
                    <option.icon className="h-4 w-4 mt-0.5" />
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-sm ${isOverLimit ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
              {charsRemaining}
            </span>
            <Button
              onClick={handlePost}
              disabled={isEmpty || isOverLimit || isPosting}
              className="rounded-full px-6 koa-gradient text-primary-foreground hover:opacity-90"
            >
              {isPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post!'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

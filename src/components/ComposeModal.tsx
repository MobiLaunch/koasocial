import { useState, useRef } from 'react';
import { Globe, Users, Lock, Mail, Loader2, Image, X } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { EmojiPicker } from '@/components/EmojiPicker';

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
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [isPosting, setIsPosting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charsRemaining = MAX_CHARS - content.length;
  const isOverLimit = charsRemaining < 0;
  const isEmpty = content.trim().length === 0 && !imageFile;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select an image under 5MB',
          variant: 'destructive',
        });
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.slice(0, start) + emoji + content.slice(end);
      setContent(newContent);
      // Set cursor position after emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    } else {
      setContent(content + emoji);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) return null;
    
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePost = async () => {
    if (isEmpty || isOverLimit || !profile) return;

    setIsPosting(true);
    try {
      let imageUrl: string | null = null;
      
      // Upload image if present
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl && imageFile) {
          // Upload failed, don't proceed
          setIsPosting(false);
          return;
        }
      }

      await createPost(profile.id, content, visibility, undefined, imageUrl);
      toast({ title: 'Posted! ✨', description: 'Your post is now live.' });
      setContent('');
      removeImage();
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

            <div className="flex-1 space-y-3">
              <Textarea
                ref={textareaRef}
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px] border-0 p-0 resize-none focus-visible:ring-0 text-base placeholder:text-muted-foreground/60"
              />

              {/* Image preview */}
              {imagePreview && (
                <div className="relative rounded-xl overflow-hidden border">
                  <img
                    src={imagePreview}
                    alt="Upload preview"
                    className="w-full max-h-64 object-cover"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border-t bg-muted/30">
          <div className="flex items-center gap-2">
            {/* Image upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-primary hover:bg-primary/10"
              onClick={() => fileInputRef.current?.click()}
              disabled={!!imageFile}
            >
              <Image className="h-5 w-5" />
            </Button>

            {/* Emoji picker */}
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />

            {/* Visibility selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 text-primary hover:bg-primary/10">
                  <VisibilityIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">{selectedVisibility.label}</span>
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
              disabled={isEmpty || isOverLimit || isPosting || uploadingImage}
              className="rounded-full px-6 koa-gradient text-primary-foreground hover:opacity-90"
            >
              {isPosting || uploadingImage ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Post!'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

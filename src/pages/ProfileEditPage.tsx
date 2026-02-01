import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Loader2, Sparkles, AtSign, User, FileText, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export default function ProfileEditPage() {
  const { profile, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({
    display_name: profile?.display_name || '',
    username: profile?.username || '',
    bio: profile?.bio || '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(profile?.banner_url || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const usernameTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username === profile?.username) {
      setUsernameAvailable(null);
      return;
    }

    // Validate username format
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      setUsernameAvailable(false);
      return;
    }

    setUsernameChecking(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (error) throw error;
      setUsernameAvailable(!data);
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailable(null);
    } finally {
      setUsernameChecking(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setFormData({ ...formData, username: sanitized });
    setUsernameAvailable(null);

    // Debounce the availability check
    if (usernameTimeoutRef.current) {
      clearTimeout(usernameTimeoutRef.current);
    }
    usernameTimeoutRef.current = setTimeout(() => {
      checkUsernameAvailability(sanitized);
    }, 500);
  };

  const uploadFile = async (file: File, bucket: string, userId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    // Validate username if changed
    if (formData.username !== profile.username) {
      if (!/^[a-z0-9_]{3,20}$/.test(formData.username)) {
        toast({
          title: 'Invalid username',
          description: 'Username must be 3-20 characters, lowercase letters, numbers, and underscores only.',
          variant: 'destructive',
        });
        return;
      }
      if (usernameAvailable === false) {
        toast({
          title: 'Username taken',
          description: 'This username is already in use. Please choose another.',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      let avatarUrl = profile.avatar_url;
      let bannerUrl = profile.banner_url;

      // Upload avatar if changed
      if (avatarFile) {
        avatarUrl = await uploadFile(avatarFile, 'avatars', user.id);
      }

      // Upload banner if changed
      if (bannerFile) {
        bannerUrl = await uploadFile(bannerFile, 'banners', user.id);
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name,
          username: formData.username,
          bio: formData.bio,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
        })
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      
      toast({
        title: 'Profile updated! ✨',
        description: 'Your changes have been saved.',
      });
      
      navigate('/profile');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const usernameChanged = formData.username !== profile.username;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/profile')}
            className="rounded-full hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="font-display text-xl font-bold">Edit Profile</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="pb-8">
        {/* Banner */}
        <div className="relative h-48 bg-gradient-to-br from-primary/20 via-koa-peach/30 to-koa-cream/40 overflow-hidden group">
          {bannerPreview && (
            <img
              src={bannerPreview}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <button
            type="button"
            onClick={() => bannerInputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300"
          >
            <div className="flex items-center gap-2 text-white bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm">
              <Camera className="h-5 w-5" />
              <span className="font-medium">Change banner</span>
            </div>
          </button>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            onChange={handleBannerChange}
            className="hidden"
          />
        </div>

        {/* Avatar */}
        <div className="px-4 -mt-16 relative z-10">
          <div className="relative inline-block group">
            <Avatar className="h-32 w-32 border-4 border-background ring-4 ring-primary/20 transition-all duration-300 group-hover:ring-primary/40">
              <AvatarImage src={avatarPreview || undefined} />
              <AvatarFallback className="text-4xl koa-gradient text-primary-foreground">
                {profile.display_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
            >
              <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Form fields */}
        <div className="px-4 mt-8 space-y-6">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="display_name" className="flex items-center gap-2 text-sm font-semibold">
              <User className="h-4 w-4 text-primary" />
              Display Name
            </Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="Your display name"
              className="rounded-xl h-12 bg-accent/30 border-transparent focus:border-primary/50 focus:bg-background transition-all duration-200"
              required
            />
          </div>

          {/* Username/Handle */}
          <div className="space-y-2">
            <Label htmlFor="username" className="flex items-center gap-2 text-sm font-semibold">
              <AtSign className="h-4 w-4 text-primary" />
              Handle
            </Label>
            <div className="relative">
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="your_handle"
                className={cn(
                  "rounded-xl h-12 bg-accent/30 border-transparent focus:border-primary/50 focus:bg-background transition-all duration-200 pr-10",
                  usernameChanged && usernameAvailable === true && "border-koa-success/50 bg-koa-success/5",
                  usernameChanged && usernameAvailable === false && "border-destructive/50 bg-destructive/5"
                )}
                required
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameChecking && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {!usernameChecking && usernameChanged && usernameAvailable === true && (
                  <Check className="h-4 w-4 text-koa-success" style={{ color: 'hsl(var(--koa-success))' }} />
                )}
                {!usernameChecking && usernameChanged && usernameAvailable === false && (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              3-20 characters • lowercase letters, numbers, underscores only
            </p>
            {usernameChanged && usernameAvailable === false && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                This handle is already taken
              </p>
            )}
            {usernameChanged && usernameAvailable === true && (
              <p className="text-xs flex items-center gap-1" style={{ color: 'hsl(var(--koa-success))' }}>
                <Check className="h-3 w-3" />
                This handle is available!
              </p>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4 text-primary" />
              Bio
            </Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell the world about yourself... ✨"
              className="rounded-xl min-h-[120px] resize-none bg-accent/30 border-transparent focus:border-primary/50 focus:bg-background transition-all duration-200"
              maxLength={300}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Share your story with the community
              </p>
              <p className={cn(
                "text-xs transition-colors",
                formData.bio.length > 280 ? "text-destructive" : "text-muted-foreground"
              )}>
                {formData.bio.length}/300
              </p>
            </div>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full rounded-xl h-12 koa-gradient text-primary-foreground hover:opacity-90 koa-shadow transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            disabled={isLoading || (usernameChanged && usernameAvailable === false)}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Save changes
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

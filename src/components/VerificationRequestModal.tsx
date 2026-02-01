import { useState, useEffect } from 'react';
import { Loader2, BadgeCheck, X, Plus, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VerificationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExistingRequest {
  id: string;
  status: string;
  created_at: string;
  reason: string;
}

export function VerificationRequestModal({ isOpen, onClose }: VerificationRequestModalProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [existingRequest, setExistingRequest] = useState<ExistingRequest | null>(null);
  const [reason, setReason] = useState('');
  const [links, setLinks] = useState<string[]>(['']);

  useEffect(() => {
    if (isOpen && profile) {
      checkExistingRequest();
    }
  }, [isOpen, profile]);

  const checkExistingRequest = async () => {
    if (!profile) return;
    
    setIsChecking(true);
    try {
      const { data, error } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setExistingRequest(data);
    } catch (error) {
      console.error('Error checking existing request:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleAddLink = () => {
    if (links.length < 5) {
      setLinks([...links, '']);
    }
  };

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleLinkChange = (index: number, value: string) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !reason.trim()) return;

    setIsLoading(true);
    try {
      const validLinks = links.filter(l => l.trim());

      const { error } = await supabase
        .from('verification_requests')
        .insert({
          profile_id: profile.id,
          reason: reason.trim(),
          links: validLinks,
        });

      if (error) throw error;

      toast({
        title: 'Request submitted! 🎉',
        description: 'We\'ll review your verification request and get back to you.',
      });

      onClose();
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pending Review</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Not Approved</span>;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-blue-500" />
            Get Verified
          </DialogTitle>
          <DialogDescription>
            Verification helps people know you're the real you
          </DialogDescription>
        </DialogHeader>

        {isChecking ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : existingRequest && existingRequest.status === 'pending' ? (
          <div className="space-y-4 py-4">
            <div className="p-4 bg-accent/30 rounded-xl text-center">
              <BadgeCheck className="h-12 w-12 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-1">Request Under Review</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Your verification request is being reviewed. We'll notify you once a decision is made.
              </p>
              {getStatusBadge(existingRequest.status)}
              <p className="text-xs text-muted-foreground mt-3">
                Submitted {new Date(existingRequest.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {existingRequest?.status === 'rejected' && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                Your previous request was not approved. You can submit a new request with additional information.
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">Why should you be verified?</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Tell us about yourself, your work, or why verification would be meaningful..."
                className="min-h-[100px] rounded-xl bg-accent/30 border-transparent focus:border-primary/50"
                required
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">{reason.length}/500</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Supporting links (optional)
              </Label>
              <p className="text-xs text-muted-foreground">
                Add links to your website, news articles, or other platforms
              </p>
              <div className="space-y-2">
                {links.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={link}
                      onChange={(e) => handleLinkChange(index, e.target.value)}
                      placeholder="https://..."
                      className="rounded-xl bg-accent/30 border-transparent focus:border-primary/50"
                    />
                    {links.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveLink(index)}
                        className="flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {links.length < 5 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleAddLink}
                    className="text-primary"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add link
                  </Button>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl koa-gradient text-primary-foreground"
              disabled={isLoading || !reason.trim()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Submit Request'
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

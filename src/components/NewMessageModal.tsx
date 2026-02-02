import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface UserResult {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
}

export const NewMessageModal = ({ isOpen, onClose, onConversationCreated }: NewMessageModalProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleSearch = async (val: string) => {
    setSearchTerm(val);
    if (val.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .or(`username.ilike.%${val}%,display_name.ilike.%${val}%`)
        .neq("id", profile?.id || "")
        .limit(10);

      if (error) throw error;
      setResults((data as UserResult[]) || []);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const startConversation = async (targetUser: UserResult) => {
    if (!profile) return;
    setIsCreating(true);

    try {
      // Updated to match your new SQL function parameters
      const { data: conversationId, error } = await (supabase.rpc as any)("get_or_create_conversation", {
        p_user_id: profile.id,
        p_target_id: targetUser.id,
      });

      if (error) throw error;

      if (conversationId) {
        onConversationCreated(conversationId);
        onClose();
      }
    } catch (err: any) {
      console.error("Error starting conversation:", err);
      toast({
        title: "Connection Failed",
        description: "Could not start a conversation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search people..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="max-h-[300px] overflow-y-auto mt-4 space-y-2">
          {isSearching ? (
            <div className="flex justify-center py-4">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : results.length > 0 ? (
            results.map((user) => (
              <button
                key={user.id}
                className="w-full flex items-center justify-between p-2 hover:bg-secondary rounded-lg transition-colors"
                onClick={() => startConversation(user)}
                disabled={isCreating}
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="font-bold text-sm">{user.display_name || user.username}</p>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  </div>
                </div>
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4 text-primary" />
                )}
              </button>
            ))
          ) : searchTerm.length >= 2 ? (
            <p className="text-center text-sm text-muted-foreground py-4">No users found</p>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">Search for a friend</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

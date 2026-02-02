import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
}

interface UserResult {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
}

export function NewMessageModal({ isOpen, onClose, onConversationCreated }: NewMessageModalProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url")
        .neq("id", profile?.id)
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  const startConversation = async (otherUser: UserResult) => {
    if (!profile) return;

    setCreating(true);
    try {
      // 1. Check if conversation already exists locally
      const { data: myParticipations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("profile_id", profile.id);

      const myIds = myParticipations?.map((p) => p.conversation_id) || [];

      if (myIds.length > 0) {
        const { data: existing } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("profile_id", otherUser.id)
          .in("conversation_id", myIds)
          .maybeSingle();

        if (existing) {
          onConversationCreated(existing.conversation_id);
          onClose();
          return;
        }
      }

      // 2. Create new conversation
      const { data: newConvo, error: convoError } = await supabase.from("conversations").insert({}).select().single();

      if (convoError) throw convoError;

      // 3. Add participants
      const { error: partError } = await supabase.from("conversation_participants").insert([
        { conversation_id: newConvo.id, profile_id: profile.id },
        { conversation_id: newConvo.id, profile_id: otherUser.id },
      ]);

      if (partError) throw partError;

      onConversationCreated(newConvo.id);
      onClose();
    } catch (error: any) {
      console.error("Error starting conversation:", error);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for a user..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {searching ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="max-h-64 overflow-y-auto space-y-1">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => startConversation(user)}
                  disabled={creating}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user.display_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <div className="font-semibold">{user.display_name}</div>
                    <div className="text-sm text-muted-foreground">@{user.username}</div>
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery.length >= 2 ? (
            <p className="text-center text-muted-foreground py-4">No users found</p>
          ) : (
            <p className="text-center text-muted-foreground py-4">Search for someone to message</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

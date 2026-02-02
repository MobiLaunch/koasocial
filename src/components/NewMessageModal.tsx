import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

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
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .or(`username.ilike.%${val}%,display_name.ilike.%${val}%`)
      .neq("id", profile?.id || "")
      .limit(10);

    if (!error && data) {
      setResults(data as UserResult[]);
    }
    setIsSearching(false);
  };

  const startConversation = async (targetUser: UserResult) => {
    if (!profile) return;
    setIsCreating(true);

    try {
      // 1. Create the conversation record
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({})
        .select()
        .single();

      if (convError) throw convError;

      // 2. Add both participants
      const { error: partError } = await supabase.from("conversation_participants").insert([
        { conversation_id: conversation.id, profile_id: profile.id },
        { conversation_id: conversation.id, profile_id: targetUser.id },
      ]);

      if (partError) throw partError;

      onConversationCreated(conversation.id);
      onClose();
    } catch (err) {
      console.error("Error starting conversation:", err);
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
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            results.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-2 hover:bg-secondary rounded-lg cursor-pointer"
                onClick={() => startConversation(user)}
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback>{user.username[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-sm">{user.display_name || user.username}</p>
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" disabled={isCreating}>
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

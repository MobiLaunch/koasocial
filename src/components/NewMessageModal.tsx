import { useState } from "react";
import { Search, Loader2, Send } from "lucide-react";
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
  actor_id?: string; // Federated Actor URI
  inbox_url?: string; // Federated Inbox
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
      // Searching the profiles table, ensuring we grab Actor metadata for ActivityPub
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, username, avatar_url, actor_id, inbox_url")
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
    if (!profile) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      // 1. LOCAL CHECK: See if a conversation already exists in our DB
      const { data: myConvos } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("profile_id", profile.id);

      const myIds = myConvos?.map((p) => p.conversation_id) || [];

      if (myIds.length > 0) {
        const { data: shared } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("profile_id", otherUser.id)
          .in("conversation_id", myIds)
          .maybeSingle();

        if (shared) {
          onConversationCreated(shared.conversation_id);
          onClose();
          return;
        }
      }

      // 2. CREATE LOCAL RECORD: New entry in conversations table
      const { data: newConvo, error: convoError } = await supabase
        .from("conversations")
        .insert({
          // We could add a 'type': 'private' or 'context' here for ActivityPub
        })
        .select()
        .single();

      if (convoError) throw convoError;

      // 3. LINK PARTICIPANTS: Map the local profile IDs
      const { error: partError } = await supabase.from("conversation_participants").insert([
        { conversation_id: newConvo.id, profile_id: profile.id },
        { conversation_id: newConvo.id, profile_id: otherUser.id },
      ]);

      if (partError) throw partError;

      // 4. FEDERATION TRIGGER (The ActivityPub Part)
      // We call a Supabase Edge Function to handle HTTP Signatures and delivery
      // This prevents the "hanging" because the heavy lifting moves to the server
      if (otherUser.actor_id) {
        await supabase.functions.invoke("activitypub-outbox", {
          body: {
            type: "Create",
            actor: profile.actor_id,
            to: [otherUser.actor_id],
            object: {
              type: "Note",
              content: `New conversation initiated by ${profile.display_name}`,
              attributedTo: profile.actor_id,
              to: [otherUser.actor_id],
            },
          },
        });
      }

      onConversationCreated(newConvo.id);
      onClose();
    } catch (error: any) {
      console.error("Conversation Error:", error);
      toast({
        title: "Action Failed",
        description: error.message || "Could not initiate federation sequence.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-primary/20 bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            New Federated Message
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username or @user@instance..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 bg-muted/50"
              autoFocus
            />
          </div>

          <div className="min-h-[200px]">
            {searching ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Searching Fediverse actors...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => startConversation(user)}
                    disabled={creating}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all disabled:opacity-50 group"
                  >
                    <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {user.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left flex-1">
                      <div className="font-bold text-foreground group-hover:text-primary transition-colors">
                        {user.display_name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">@{user.username}</div>
                    </div>
                    {creating ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <div className="text-[10px] bg-muted px-2 py-1 rounded-full text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary">
                        Connect
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  {searchQuery.length < 2
                    ? "Enter a name to find users across the network."
                    : "No actors found. Try a full handle like user@domain.com"}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

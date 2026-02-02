import { useState, useEffect } from "react";
import { MessageCircle, Plus, Loader2, Search, CheckCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { NewMessageModal } from "@/components/NewMessageModal";
import { ConversationView } from "@/components/ConversationView";

interface ConversationWithParticipant {
  id: string;
  updated_at: string;
  participant: {
    id: string;
    display_name: string;
    username: string;
    avatar_url: string | null;
  };
  lastMessage?: {
    content: string;
    sender_id: string;
    created_at: string;
  };
  unreadCount: number;
}

export default function MessagesPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ConversationWithParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  const loadConversations = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      // 1. Get my participations
      const { data: participations, error: partError } = await supabase
        .from("conversation_participants")
        .select("conversation_id, last_read_at")
        .eq("profile_id", profile.id);

      if (partError) throw partError;
      if (!participations?.length) {
        setConversations([]);
        return;
      }

      const conversationIds = participations.map((p) => p.conversation_id);
      const lastReadMap = new Map(participations.map((p) => [p.conversation_id, p.last_read_at]));

      // 2. Get conversation details
      const { data: convos, error: convoError } = await supabase
        .from("conversations")
        .select("id, updated_at")
        .in("id", conversationIds)
        .order("updated_at", { ascending: false });

      if (convoError) throw convoError;

      const results: ConversationWithParticipant[] = [];

      // 3. Hydrate conversations with participant and message data
      for (const convo of convos || []) {
        const { data: otherPart } = await supabase
          .from("conversation_participants")
          .select("profile_id")
          .eq("conversation_id", convo.id)
          .neq("profile_id", profile.id)
          .maybeSingle();

        if (otherPart) {
          const { data: otherProfile } = await supabase
            .from("profiles")
            .select("id, display_name, username, avatar_url")
            .eq("id", otherPart.profile_id)
            .single();

          const { data: messages } = await supabase
            .from("messages")
            .select("content, sender_id, created_at")
            .eq("conversation_id", convo.id)
            .order("created_at", { ascending: false })
            .limit(1);

          const lastRead = lastReadMap.get(convo.id);
          const { count } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", convo.id)
            .neq("sender_id", profile.id)
            .gt("created_at", lastRead || "1970-01-01");

          if (otherProfile) {
            results.push({
              id: convo.id,
              updated_at: convo.updated_at,
              participant: otherProfile,
              lastMessage: messages?.[0],
              unreadCount: count || 0,
            });
          }
        }
      }
      setConversations(results);
    } catch (error: any) {
      console.error("Error loading conversations:", error);
      toast({ title: "Error", description: "Failed to load conversations", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();

    // Realtime subscription to refresh list on new messages
    const channel = supabase
      .channel("messages-refresh")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        loadConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const filteredConversations = conversations.filter(
    (c) =>
      c.participant.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.participant.username.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (selectedConversation) {
    return (
      <ConversationView
        conversationId={selectedConversation}
        onBack={() => {
          setSelectedConversation(null);
          loadConversations();
        }}
      />
    );
  }

  return (
    <div className="animate-fade-in pb-20 sm:pb-0">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-6 w-6 text-primary" />
            <h1 className="font-bold text-xl">Messages</h1>
          </div>
          <Button size="sm" onClick={() => setNewMessageOpen(true)} className="rounded-full">
            <Plus className="h-4 w-4 mr-2" />
            New
          </Button>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-secondary/50 border-none rounded-full"
          />
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="p-6 text-center py-20">
          <Card className="p-8 space-y-4 border-dashed">
            <h2 className="text-xl font-bold">No messages yet</h2>
            <p className="text-muted-foreground">Sent messages will appear here.</p>
            <Button onClick={() => setNewMessageOpen(true)}>Start a conversation</Button>
          </Card>
        </div>
      ) : (
        <div className="divide-y">
          {filteredConversations.map((convo) => (
            <button
              key={convo.id}
              onClick={() => setSelectedConversation(convo.id)}
              className="w-full p-4 flex items-center gap-3 hover:bg-secondary/30 transition-colors text-left"
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={convo.participant.avatar_url || undefined} />
                <AvatarFallback>{convo.participant.display_name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold truncate">{convo.participant.display_name}</span>
                  {convo.lastMessage && (
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(convo.lastMessage.created_at), { addSuffix: true })}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {convo.lastMessage?.sender_id === profile?.id && <CheckCheck className="h-3 w-3 text-primary" />}
                  <p
                    className={`text-sm truncate ${convo.unreadCount > 0 ? "font-bold text-foreground" : "text-muted-foreground"}`}
                  >
                    {convo.lastMessage?.content || "Started a conversation"}
                  </p>
                  {convo.unreadCount > 0 && (
                    <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {convo.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <NewMessageModal
        isOpen={newMessageOpen}
        onClose={() => setNewMessageOpen(false)}
        onConversationCreated={(id) => {
          setNewMessageOpen(false);
          setSelectedConversation(id);
        }}
      />
    </div>
  );
}

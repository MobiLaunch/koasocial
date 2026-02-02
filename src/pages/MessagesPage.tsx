import { useState, useEffect } from 'react';
import { MessageCircle, Plus, Loader2, Search, CheckCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { NewMessageModal } from '@/components/NewMessageModal';
import { ConversationView } from '@/components/ConversationView';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  const loadConversations = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      // Get all conversations this user is part of
      const { data: participations, error: partError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, last_read_at')
        .eq('profile_id', profile.id);

      if (partError) throw partError;
      if (!participations?.length) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const conversationIds = participations.map(p => p.conversation_id);
      const lastReadMap = new Map(participations.map(p => [p.conversation_id, p.last_read_at]));

      // Get conversation details
      const { data: convos, error: convoError } = await supabase
        .from('conversations')
        .select('id, updated_at')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (convoError) throw convoError;

      // Get other participants for each conversation
      const conversationsWithParticipants: ConversationWithParticipant[] = [];

      for (const convo of convos || []) {
        // Get the other participant
        const { data: otherParticipants } = await supabase
          .from('conversation_participants')
          .select('profile_id')
          .eq('conversation_id', convo.id)
          .neq('profile_id', profile.id);

        if (otherParticipants?.[0]) {
          const { data: otherProfile } = await supabase
            .from('profiles')
            .select('id, display_name, username, avatar_url')
            .eq('id', otherParticipants[0].profile_id)
            .single();

          // Get last message
          const { data: messages } = await supabase
            .from('messages')
            .select('content, sender_id, created_at')
            .eq('conversation_id', convo.id)
            .order('created_at', { ascending: false })
            .limit(1);

          // Count unread messages
          const lastRead = lastReadMap.get(convo.id);
          let unreadQuery = supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', convo.id)
            .neq('sender_id', profile.id);

          if (lastRead) {
            unreadQuery = unreadQuery.gt('created_at', lastRead);
          }

          const { count: unreadCount } = await unreadQuery;

          if (otherProfile) {
            conversationsWithParticipants.push({
              id: convo.id,
              updated_at: convo.updated_at,
              participant: otherProfile,
              lastMessage: messages?.[0],
              unreadCount: unreadCount || 0,
            });
          }
        }
      }

      setConversations(conversationsWithParticipants);
    } catch (error: any) {
      console.error('Error loading conversations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [profile]);

  const filteredConversations = conversations.filter(c =>
    c.participant.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.participant.username.toLowerCase().includes(searchQuery.toLowerCase())
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
    <div className="animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="h-6 w-6 text-primary" />
            <h1 className="font-display text-xl font-bold text-foreground">Messages</h1>
          </div>
          <Button
            size="sm"
            onClick={() => setNewMessageOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New</span>
          </Button>
        </div>

        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading conversations...</p>
        </div>
      ) : conversations.length === 0 ? (
        <div className="p-6 max-w-lg mx-auto">
          <Card className="p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">No messages yet</h2>
              <p className="text-muted-foreground">
                Start a conversation with someone!
              </p>
            </div>
            <Button onClick={() => setNewMessageOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              New Message
            </Button>
          </Card>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {filteredConversations.map((convo) => (
            <button
              key={convo.id}
              onClick={() => setSelectedConversation(convo.id)}
              className="w-full p-4 flex items-center gap-3 hover:bg-accent/50 transition-colors text-left"
            >
              <Avatar className="h-12 w-12 ring-2 ring-background">
                <AvatarImage src={convo.participant.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {convo.participant.display_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-semibold truncate ${convo.unreadCount > 0 ? 'text-foreground' : 'text-foreground'}`}>
                    {convo.participant.display_name}
                  </span>
                  {convo.lastMessage && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(convo.lastMessage.created_at), { addSuffix: true })}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {convo.lastMessage && convo.lastMessage.sender_id === profile?.id && (
                    <CheckCheck className="h-3 w-3 text-primary flex-shrink-0" />
                  )}
                  <p className={`text-sm truncate ${convo.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {convo.lastMessage?.content || 'No messages yet'}
                  </p>
                  {convo.unreadCount > 0 && (
                    <span className="ml-auto flex-shrink-0 h-5 min-w-5 px-1.5 rounded-full bg-primary text-xs font-bold text-primary-foreground flex items-center justify-center">
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
        onConversationCreated={(conversationId) => {
          setNewMessageOpen(false);
          setSelectedConversation(conversationId);
        }}
      />
    </div>
  );
}

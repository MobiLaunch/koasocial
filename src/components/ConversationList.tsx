import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Conversation } from "@/hooks/useMessages";

interface ConversationListProps {
  conversations: Conversation[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({ 
  conversations, 
  loading, 
  selectedId, 
  onSelect 
}: ConversationListProps) {
  const { profile } = useAuth();

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!conversations.length) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>No conversations yet</p>
        <p className="text-sm mt-1">Start a conversation from someone's profile</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2">
        {conversations.map((conversation) => {
          const otherParticipant = conversation.participants.find(
            p => p.profile_id !== profile?.id
          );
          
          if (!otherParticipant) return null;

          const { profile: other } = otherParticipant;
          
          return (
            <button
              key={conversation.id}
              onClick={() => onSelect(conversation.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors hover:bg-accent ${
                selectedId === conversation.id ? 'bg-accent' : ''
              }`}
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={other.avatar_url || undefined} />
                <AvatarFallback>{other.display_name[0]}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-semibold truncate">{other.display_name}</span>
                  {other.is_verified && (
                    <VerifiedBadge tier={other.verification_tier} />
                  )}
                </div>
                
                {conversation.last_message && (
                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.last_message.sender_id === profile?.id ? 'You: ' : ''}
                    {conversation.last_message.content}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-1">
                {conversation.last_message && (
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: false })}
                  </span>
                )}
                {conversation.unread_count > 0 && (
                  <Badge variant="default" className="h-5 min-w-5 px-1.5 flex items-center justify-center">
                    {conversation.unread_count}
                  </Badge>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}

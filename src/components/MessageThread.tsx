import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { Check, CheckCheck, Send, ArrowLeft } from "lucide-react";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { Message, Conversation } from "@/hooks/useMessages";
import { cn } from "@/lib/utils";

interface MessageThreadProps {
  conversation: Conversation | null;
  messages: Message[];
  loading: boolean;
  onSendMessage: (content: string) => Promise<void>;
  onMarkAsRead: () => void;
  onBack?: () => void;
}

export function MessageThread({
  conversation,
  messages,
  loading,
  onSendMessage,
  onMarkAsRead,
  onBack
}: MessageThreadProps) {
  const { profile } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const otherParticipant = conversation?.participants.find(
    p => p.profile_id !== profile?.id
  );

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark as read when viewing
  useEffect(() => {
    if (conversation && messages.length > 0) {
      onMarkAsRead();
    }
  }, [conversation, messages.length, onMarkAsRead]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await onSendMessage(newMessage);
      setNewMessage("");
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, "h:mm a");
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, "h:mm a")}`;
    }
    return format(date, "MMM d, h:mm a");
  };

  const getReadStatus = (message: Message) => {
    if (message.sender_id !== profile?.id) return null;
    
    // Check if the other participant has read this message
    const otherLastRead = otherParticipant?.last_read_at;
    if (!otherLastRead) return 'sent';
    
    const messageTime = new Date(message.created_at);
    const readTime = new Date(otherLastRead);
    
    return messageTime <= readTime ? 'read' : 'sent';
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>Select a conversation to start messaging</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 p-4 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'justify-end' : ''}`}>
            {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full" />}
            <Skeleton className="h-16 w-48 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        {otherParticipant && (
          <>
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherParticipant.profile.avatar_url || undefined} />
              <AvatarFallback>{otherParticipant.profile.display_name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold">{otherParticipant.profile.display_name}</span>
                {otherParticipant.profile.is_verified && (
                  <VerifiedBadge tier={otherParticipant.profile.verification_tier} />
                )}
              </div>
              <span className="text-sm text-muted-foreground">@{otherParticipant.profile.username}</span>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No messages yet. Say hello! 👋
            </p>
          ) : (
            messages.map((message, index) => {
              const isOwn = message.sender_id === profile?.id;
              const readStatus = getReadStatus(message);
              const showAvatar = !isOwn && (
                index === 0 || 
                messages[index - 1]?.sender_id !== message.sender_id
              );

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2",
                    isOwn ? "justify-end" : "justify-start"
                  )}
                >
                  {!isOwn && (
                    <div className="w-8">
                      {showAvatar && message.sender && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.sender.avatar_url || undefined} />
                          <AvatarFallback>{message.sender.display_name[0]}</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  )}
                  
                  <div className={cn(
                    "max-w-[70%] flex flex-col",
                    isOwn ? "items-end" : "items-start"
                  )}>
                    <div
                      className={cn(
                        "px-4 py-2 rounded-2xl",
                        isOwn 
                          ? "bg-primary text-primary-foreground rounded-br-md" 
                          : "bg-muted rounded-bl-md"
                      )}
                    >
                      <p className="break-words whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-1 px-1">
                      <span className="text-xs text-muted-foreground">
                        {formatMessageDate(message.created_at)}
                      </span>
                      {isOwn && readStatus && (
                        readStatus === 'read' ? (
                          <CheckCheck className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <Check className="h-3.5 w-3.5 text-muted-foreground" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1"
          />
          <Button 
            onClick={handleSend} 
            disabled={!newMessage.trim() || sending}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

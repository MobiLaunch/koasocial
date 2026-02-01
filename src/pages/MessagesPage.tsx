import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useConversations, useMessages } from "@/hooks/useMessages";
import { ConversationList } from "@/components/ConversationList";
import { MessageThread } from "@/components/MessageThread";
import { useIsMobile } from "@/hooks/use-mobile";

export default function MessagesPage() {
  const [searchParams] = useSearchParams();
  const conversationParam = searchParams.get('conversation');
  
  const [selectedConversation, setSelectedConversation] = useState<string | null>(conversationParam);
  const { conversations, loading: conversationsLoading, refetch } = useConversations();
  const { messages, loading: messagesLoading, sendMessage, markAsRead } = useMessages(selectedConversation);
  const isMobile = useIsMobile();

  // Update selected conversation when URL param changes
  useEffect(() => {
    if (conversationParam) {
      setSelectedConversation(conversationParam);
    }
  }, [conversationParam]);

  const selectedConv = conversations.find(c => c.id === selectedConversation) || null;

  // On mobile, show either list or thread
  if (isMobile) {
    if (selectedConversation && selectedConv) {
      return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
          <MessageThread
            conversation={selectedConv}
            messages={messages}
            loading={messagesLoading}
            onSendMessage={sendMessage}
            onMarkAsRead={markAsRead}
            onBack={() => setSelectedConversation(null)}
          />
        </div>
      );
    }

    return (
      <div className="h-[calc(100vh-8rem)]">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">Messages</h1>
        </div>
        <ConversationList
          conversations={conversations}
          loading={conversationsLoading}
          selectedId={selectedConversation}
          onSelect={setSelectedConversation}
        />
      </div>
    );
  }

  // Desktop: side-by-side layout
  return (
    <div className="h-[calc(100vh-2rem)] flex">
      {/* Conversations sidebar */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">Messages</h1>
        </div>
        <ConversationList
          conversations={conversations}
          loading={conversationsLoading}
          selectedId={selectedConversation}
          onSelect={setSelectedConversation}
        />
      </div>

      {/* Message thread */}
      <MessageThread
        conversation={selectedConv}
        messages={messages}
        loading={messagesLoading}
        onSendMessage={sendMessage}
        onMarkAsRead={markAsRead}
      />
    </div>
  );
}

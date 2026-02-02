import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useRealtimeChat, type ChatMessage } from '@/hooks/use-realtime-chat'
import { useChatScroll } from '@/hooks/use-chat-scroll'
import { ChatMessageItem } from './chat-message'

interface RealtimeChatProps {
  roomName: string
  username: string
  initialMessages?: ChatMessage[]
  onMessage?: (message: ChatMessage) => void
  containerClassName?: string
}

export function RealtimeChat({
  roomName,
  username,
  initialMessages,
  onMessage,
  containerClassName,
}: RealtimeChatProps) {
  const [newMessage, setNewMessage] = useState('')
  const { messages, sendMessage: sendBroadcast } = useRealtimeChat({
    roomName,
    username,
    initialMessages,
  })
  const scrollRef = useChatScroll(messages)

  const handleSend = async () => {
    if (!newMessage.trim()) return

    const sentMessage = await sendBroadcast(newMessage)
    setNewMessage('')
    
    // Trigger the callback to save to database
    if (onMessage) {
      onMessage(sentMessage)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={`flex flex-col h-full ${containerClassName}`}>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((msg) => (
          <ChatMessageItem
            key={msg.id}
            message={msg}
            isOwnMessage={msg.user.name === username || msg.isOwnMessage === true}
          />
        ))}
        <div ref={scrollRef} />
      </div>

      <div className="border-t p-4 bg-background">
        <div className="flex gap-2">
          <Textarea
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
          />
          <Button 
            onClick={handleSend} 
            disabled={!newMessage.trim()} 
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

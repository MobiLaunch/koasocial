import { useState, useCallback, useEffect } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useRealtimeChat, type ChatMessage } from '@/hooks/use-realtime-chat'
import { useChatScroll } from '@/hooks/use-chat-scroll'
import { ChatMessageItem } from './chat-message'
import { TypingIndicator } from './TypingIndicator'

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
  const { messages, sendMessage: sendBroadcast, typingUsers, setTyping } = useRealtimeChat({
    roomName,
    username,
    initialMessages,
  })
  const scrollRef = useChatScroll(messages)

  // Handle typing indicator
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)
    if (e.target.value.length > 0) {
      setTyping(true)
    }
  }, [setTyping])

  const handleSend = async () => {
    if (!newMessage.trim()) return

    setTyping(false)
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

  // Stop typing when input loses focus
  const handleBlur = useCallback(() => {
    if (newMessage.length === 0) {
      setTyping(false)
    }
  }, [newMessage, setTyping])

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
        
        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <TypingIndicator usernames={typingUsers} />
        )}
        
        <div ref={scrollRef} />
      </div>

      <div className="border-t p-4 bg-background">
        <div className="flex gap-2">
          <Textarea
            placeholder="Type a message..."
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="min-h-[44px] max-h-32 resize-none rounded-xl"
            rows={1}
          />
          <Button 
            onClick={handleSend} 
            disabled={!newMessage.trim()} 
            size="icon"
            className="rounded-xl koa-gradient text-primary-foreground"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/hooks/use-realtime-chat'
import { Check, CheckCheck } from 'lucide-react'

interface ChatMessageItemProps {
  message: ChatMessage
  isOwnMessage: boolean
}

export const ChatMessageItem = ({ message, isOwnMessage }: ChatMessageItemProps) => {
  return (
    <div className={cn('flex mt-2', isOwnMessage ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] w-fit flex flex-col gap-1',
          isOwnMessage ? 'items-end' : 'items-start'
        )}
      >
        <div className="flex items-center gap-2 text-xs px-1 text-muted-foreground">
          <span className="font-medium">{message.user.name}</span>
          <span>
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <div
          className={cn(
            'py-2.5 px-4 rounded-2xl text-sm w-fit break-words shadow-sm',
            isOwnMessage
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-surface-container-high text-foreground rounded-bl-md'
          )}
        >
          {message.content}
        </div>
        
        {/* Read receipt indicator for own messages */}
        {isOwnMessage && (
          <div className="flex items-center gap-1 px-1">
            {message.readAt ? (
              <CheckCheck className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Check className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

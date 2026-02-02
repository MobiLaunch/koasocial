import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/hooks/use-realtime-chat'

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
            'py-2 px-3 rounded-xl text-sm w-fit break-words',
            isOwnMessage
              ? 'bg-primary text-primary-foreground rounded-br-none'
              : 'bg-muted text-foreground rounded-bl-none'
          )}
        >
          {message.content}
        </div>
      </div>
    </div>
  )
}
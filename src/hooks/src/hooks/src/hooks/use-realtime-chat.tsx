import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface ChatMessage {
  id: string
  content: string
  user: {
    name: string
  }
  createdAt: string
  isOwnMessage?: boolean
}

interface UseRealtimeChatProps {
  roomName: string
  username: string
  initialMessages?: ChatMessage[]
}

export function useRealtimeChat({
  roomName,
  username,
  initialMessages = [],
}: UseRealtimeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)

  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  useEffect(() => {
    const channel = supabase.channel(`room:${roomName}`)

    channel
      .on(
        'broadcast',
        { event: 'message' },
        ({ payload }: { payload: ChatMessage }) => {
          setMessages((prev) => [...prev, payload])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomName])

  const sendMessage = async (content: string) => {
    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      content,
      user: { name: username },
      createdAt: new Date().toISOString(),
      isOwnMessage: true,
    }

    // Update local state immediately
    setMessages((prev) => [...prev, newMessage])

    // Broadcast to others
    const channel = supabase.channel(`room:${roomName}`)
    await channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.send({
          type: 'broadcast',
          event: 'message',
          payload: { ...newMessage, isOwnMessage: false },
        })
      }
    })

    return newMessage
  }

  return { messages, sendMessage }
}

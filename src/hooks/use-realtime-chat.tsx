import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/integrations/supabase/client'

export interface ChatMessage {
  id: string
  content: string
  user: {
    name: string
  }
  createdAt: string
  isOwnMessage?: boolean
  readAt?: string | null
}

interface UseRealtimeChatProps {
  roomName: string
  username: string
  initialMessages?: ChatMessage[]
}

interface PresenceState {
  typing: boolean
  username: string
}

export function useRealtimeChat({
  roomName,
  username,
  initialMessages = [],
}: UseRealtimeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  useEffect(() => {
    const channel = supabase.channel(`room:${roomName}`, {
      config: {
        presence: { key: username },
      },
    })
    channelRef.current = channel

    channel
      .on(
        'broadcast',
        { event: 'message' },
        ({ payload }: { payload: ChatMessage }) => {
          setMessages((prev) => {
            if (prev.some((message) => message.id === payload.id)) {
              return prev
            }
            return [...prev, payload]
          })
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceState>()
        const typing = Object.values(state)
          .flat()
          .filter((p) => p.typing && p.username !== username)
          .map((p) => p.username)
        setTypingUsers(typing)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ typing: false, username })
        }
      })

    return () => {
      supabase.removeChannel(channel)
      if (channelRef.current === channel) {
        channelRef.current = null
      }
    }
  }, [roomName, username])

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

    // Stop typing indicator
    setTyping(false)

    // Broadcast to others
    const channel = channelRef.current
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'message',
        payload: { ...newMessage, isOwnMessage: false },
      })
    }

    return newMessage
  }

  const setTyping = useCallback(async (isTyping: boolean) => {
    const channel = channelRef.current
    if (!channel) return

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    await channel.track({ typing: isTyping, username })

    // Auto-stop typing after 3 seconds
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        channel.track({ typing: false, username })
      }, 3000)
    }
  }, [username])

  return { messages, sendMessage, typingUsers, setTyping }
}

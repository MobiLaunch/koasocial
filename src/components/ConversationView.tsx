import { useState, useEffect } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { RealtimeChat } from './realtime-chat'
import type { ChatMessage } from '@/hooks/use-realtime-chat'

interface ConversationViewProps {
  conversationId: string
  onBack: () => void
}

interface OtherParticipant {
  id: string
  display_name: string
  username: string
  avatar_url: string | null
}

export function ConversationView({ conversationId, onBack }: ConversationViewProps) {
  const { profile } = useAuth()
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([])
  const [otherParticipant, setOtherParticipant] = useState<OtherParticipant | null>(null)
  const [loading, setLoading] = useState(true)

  const loadConversation = async () => {
    if (!profile) return

    try {
      // 1. Get other participant
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('profile_id')
        .eq('conversation_id', conversationId)
        .neq('profile_id', profile.id)

      if (participants?.[0]) {
        const { data: otherProfile } = await supabase
          .from('profiles')
          .select('id, display_name, username, avatar_url')
          .eq('id', participants[0].profile_id)
          .single()

        if (otherProfile) setOtherParticipant(otherProfile)
      }

      // 2. Get history from DB
      const { data: msgs, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error

      // 3. Transform DB messages to ChatComponent format
      const formattedMessages: ChatMessage[] = (msgs || []).map((msg) => ({
        id: msg.id,
        content: msg.content,
        createdAt: msg.created_at,
        user: { 
          // We don't have the sender name in the message table usually, 
          // so we check if it's us or them
          name: msg.sender_id === profile.id 
            ? (profile.display_name || profile.username || 'Me')
            : (otherParticipant?.display_name || 'Them')
        },
        isOwnMessage: msg.sender_id === profile.id
      }))

      setInitialMessages(formattedMessages)

      // 4. Mark as read
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('profile_id', profile.id)

    } catch (error) {
      console.error('Error loading conversation:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConversation()
  }, [conversationId, profile])

  // This function ensures persistence: It saves the message to Supabase
  // after the UI has already optimistically shown it.
  const handleSaveMessage = async (message: ChatMessage) => {
    if (!profile) return

    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: profile.id,
        content: message.content,
      })

      if (error) throw error

      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)
        
    } catch (error) {
      console.error('Error persisting message:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {otherParticipant && (
            <>
              <Avatar className="h-10 w-10">
                <AvatarImage src={otherParticipant.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {otherParticipant.display_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-foreground">
                  {otherParticipant.display_name}
                </div>
                <div className="text-sm text-muted-foreground">
                  @{otherParticipant.username}
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main Chat Component */}
      <RealtimeChat
        roomName={conversationId}
        username={profile?.display_name || profile?.username || 'Anonymous'}
        initialMessages={initialMessages}
        onMessage={handleSaveMessage}
        containerClassName="flex-1 min-h-0"
      />
    </div>
  )
}

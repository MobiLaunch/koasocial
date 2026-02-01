import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    is_verified: boolean | null;
    verification_tier: string | null;
  };
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  participants: {
    profile_id: string;
    last_read_at: string | null;
    profile: {
      id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
      is_verified: boolean | null;
      verification_tier: string | null;
    };
  }[];
  last_message?: Message;
  unread_count: number;
}

export function useConversations() {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!profile) return;

    try {
      // Get all conversations the user is part of
      const { data: participantData, error: participantError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('profile_id', profile.id);

      if (participantError) throw participantError;

      if (!participantData?.length) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const conversationIds = participantData.map(p => p.conversation_id);

      // Get conversation details with participants
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (convError) throw convError;

      // Get all participants for these conversations
      const { data: allParticipants, error: allParticipantsError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          profile_id,
          last_read_at,
          profile:profiles!conversation_participants_profile_id_fkey (
            id,
            username,
            display_name,
            avatar_url,
            is_verified,
            verification_tier
          )
        `)
        .in('conversation_id', conversationIds);

      if (allParticipantsError) throw allParticipantsError;

      // Get last message for each conversation
      const conversationsWithDetails = await Promise.all(
        (convData || []).map(async (conv) => {
          const { data: messages } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!messages_sender_id_fkey (
                id,
                username,
                display_name,
                avatar_url,
                is_verified,
                verification_tier
              )
            `)
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1);

          const participants = (allParticipants || [])
            .filter(p => p.conversation_id === conv.id)
            .map(p => ({
              profile_id: p.profile_id,
              last_read_at: p.last_read_at,
              profile: p.profile as Conversation['participants'][0]['profile']
            }));

          // Calculate unread count
          const myParticipant = participants.find(p => p.profile_id === profile.id);
          const lastReadAt = myParticipant?.last_read_at;
          
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', profile.id)
            .gt('created_at', lastReadAt || '1970-01-01');

          return {
            ...conv,
            participants,
            last_message: messages?.[0] as Message | undefined,
            unread_count: count || 0
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel('conversations-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, fetchConversations]);

  return { conversations, loading, refetch: fetchConversations };
}

export function useMessages(conversationId: string | null) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey (
            id,
            username,
            display_name,
            avatar_url,
            is_verified,
            verification_tier
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data as Message[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          // Fetch the full message with sender info
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!messages_sender_id_fkey (
                id,
                username,
                display_name,
                avatar_url,
                is_verified,
                verification_tier
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages(prev => [...prev, data as Message]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const sendMessage = async (content: string) => {
    if (!conversationId || !profile || !content.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: profile.id,
          content: content.trim()
        });

      if (error) throw error;

      // Update conversation updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const markAsRead = async () => {
    if (!conversationId || !profile) return;

    try {
      await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('profile_id', profile.id);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  return { messages, loading, sendMessage, markAsRead, refetch: fetchMessages };
}

export async function createConversation(participantIds: string[]) {
  try {
    // Create the conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .single();

    if (convError) throw convError;

    // Add all participants
    const participantInserts = participantIds.map(profileId => ({
      conversation_id: conversation.id,
      profile_id: profileId
    }));

    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert(participantInserts);

    if (participantsError) throw participantsError;

    return conversation;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
}

export async function findExistingConversation(profileId1: string, profileId2: string) {
  try {
    // Find conversations where both users are participants
    const { data: myConversations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('profile_id', profileId1);

    if (!myConversations?.length) return null;

    const conversationIds = myConversations.map(c => c.conversation_id);

    const { data: theirConversations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('profile_id', profileId2)
      .in('conversation_id', conversationIds);

    if (!theirConversations?.length) return null;

    // Check if any of these are 1-on-1 conversations (exactly 2 participants)
    for (const conv of theirConversations) {
      const { count } = await supabase
        .from('conversation_participants')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conv.conversation_id);

      if (count === 2) {
        return conv.conversation_id;
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding conversation:', error);
    return null;
  }
}

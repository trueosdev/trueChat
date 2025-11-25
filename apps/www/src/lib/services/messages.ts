import { supabase } from '../supabase/client'
import type { Message } from '@/app/data'

export interface MessageWithUser extends Message {
  id: string
  sender_id: string
  conversation_id: string
  content: string
  created_at: string
  sender: {
    id: string
    username: string | null
    fullname: string | null
    avatar_url: string | null
  }
}

export async function getMessages(conversationId: string): Promise<MessageWithUser[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching messages:', error)
    return []
  }

  // Fetch sender details for all unique sender IDs
  const senderIds = new Set((data || []).map((msg: any) => msg.sender_id))
  const { data: senders } = await supabase
    .from('users')
    .select('id, username, fullname, avatar_url')
    .in('id', Array.from(senderIds))

  const senderMap = new Map((senders || []).map((s: any) => [s.id, s]))

  return (data || []).map((msg: any) => {
    const sender = senderMap.get(msg.sender_id) || {
      id: msg.sender_id,
      username: null,
      fullname: null,
      avatar_url: null,
    }

    return {
      id: msg.id,
      sender_id: msg.sender_id,
      conversation_id: msg.conversation_id,
      content: msg.content,
      created_at: msg.created_at,
      message: msg.content,
      timestamp: new Date(msg.created_at).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      name: sender.fullname || sender.username || 'Unknown',
      avatar: sender.avatar_url || '',
      sender: {
        id: sender.id,
        username: sender.username,
        fullname: sender.fullname,
        avatar_url: sender.avatar_url,
      },
    }
  })
}

export async function sendMessage(
  conversationId: string,
  content: string,
  senderId: string
): Promise<MessageWithUser | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      content: content.trim(),
      sender_id: senderId,
    })
    .select('*')
    .single()

  if (error) {
    console.error('Error sending message:', error)
    return null
  }

  // Fetch sender details
  const { data: sender } = await supabase
    .from('users')
    .select('id, username, fullname, avatar_url')
    .eq('id', senderId)
    .single()

  const senderData = sender || {
    id: senderId,
    username: null,
    fullname: null,
    avatar_url: null,
  }

  return {
    id: data.id,
    sender_id: data.sender_id,
    conversation_id: data.conversation_id,
    content: data.content,
    created_at: data.created_at,
    message: data.content,
    timestamp: new Date(data.created_at).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
    name: senderData.fullname || senderData.username || 'Unknown',
    avatar: senderData.avatar_url || '',
    sender: {
      id: senderData.id,
      username: senderData.username,
      fullname: senderData.fullname,
      avatar_url: senderData.avatar_url,
    },
  }
}

export function subscribeToMessages(
  conversationId: string,
  callback: (message: MessageWithUser) => void
) {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        const msg = payload.new as any
        const { data: sender } = await supabase
          .from('users')
          .select('id, username, fullname, avatar_url')
          .eq('id', msg.sender_id)
          .single()

        callback({
          id: msg.id,
          sender_id: msg.sender_id,
          conversation_id: msg.conversation_id,
          content: msg.content,
          created_at: msg.created_at,
          message: msg.content,
          timestamp: new Date(msg.created_at).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
          name: sender?.fullname || sender?.username || 'Unknown',
          avatar: sender?.avatar_url || '',
          sender: {
            id: sender?.id || msg.sender_id,
            username: sender?.username || null,
            fullname: sender?.fullname || null,
            avatar_url: sender?.avatar_url || null,
          },
        })
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}


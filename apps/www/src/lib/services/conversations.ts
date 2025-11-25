import { supabase } from '../supabase/client'
import type { Conversation } from '@/lib/types/supabase'
import type { ConversationWithUser } from '@/app/data'

export async function getConversations(userId: string): Promise<ConversationWithUser[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching conversations:', error)
    return []
  }

  // Fetch user details for all unique user IDs
  const userIds = new Set<string>()
  data?.forEach((conv: any) => {
    userIds.add(conv.user1_id)
    userIds.add(conv.user2_id)
  })

  const { data: users } = await supabase
    .from('users')
    .select('id, username, fullname, avatar_url, email')
    .in('id', Array.from(userIds))

  const userMap = new Map((users || []).map((u: any) => [u.id, u]))

  return (data || []).map((conv: any) => {
    const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id
    const otherUser = userMap.get(otherUserId) || {
      id: otherUserId,
      username: null,
      fullname: null,
      avatar_url: null,
      email: '',
    }

    return {
      id: conv.id,
      created_at: conv.created_at,
      user1_id: conv.user1_id,
      user2_id: conv.user2_id,
      last_message: conv.last_message,
      other_user: {
        id: otherUser.id,
        username: otherUser.username,
        fullname: otherUser.fullname,
        avatar_url: otherUser.avatar_url,
        email: otherUser.email,
      },
    }
  })
}

export async function createConversation(user1Id: string, user2Id: string): Promise<Conversation | null> {
  // Check if conversation already exists
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
    .single()

  if (existing) {
    return existing
  }

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user1_id: user1Id,
      user2_id: user2Id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating conversation:', error)
    return null
  }

  return data
}

export async function getConversationById(id: string): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching conversation:', error)
    return null
  }

  return data
}

export function subscribeToConversations(
  userId: string,
  callback: (conversation: ConversationWithUser) => void
) {
  const channel = supabase
    .channel('conversations-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `user1_id=eq.${userId}`,
      },
      async (payload) => {
        const conv = payload.new as any
        const { data: user2 } = await supabase
          .from('users')
          .select('id, username, fullname, avatar_url, email')
          .eq('id', conv.user2_id)
          .single()

        callback({
          id: conv.id,
          created_at: conv.created_at,
          user1_id: conv.user1_id,
          user2_id: conv.user2_id,
          last_message: conv.last_message,
          other_user: user2 || {
            id: conv.user2_id,
            username: null,
            fullname: null,
            avatar_url: null,
            email: '',
          },
        })
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `user2_id=eq.${userId}`,
      },
      async (payload) => {
        const conv = payload.new as any
        const { data: user1 } = await supabase
          .from('users')
          .select('id, username, fullname, avatar_url, email')
          .eq('id', conv.user1_id)
          .single()

        callback({
          id: conv.id,
          created_at: conv.created_at,
          user1_id: conv.user1_id,
          user2_id: conv.user2_id,
          last_message: conv.last_message,
          other_user: user1 || {
            id: conv.user1_id,
            username: null,
            fullname: null,
            avatar_url: null,
            email: '',
          },
        })
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}


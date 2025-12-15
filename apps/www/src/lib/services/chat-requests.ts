import { supabase } from '../supabase/client'
import { createConversation } from './conversations'

export interface ChatRequest {
  id: string
  requester_id: string
  recipient_id: string
  status: 'pending' | 'accepted' | 'denied'
  created_at: string
  updated_at: string
  denied_at: string | null
  requester?: {
    id: string
    username: string | null
    fullname: string | null
    avatar_url: string | null
    email: string
  }
  recipient?: {
    id: string
    username: string | null
    fullname: string | null
    avatar_url: string | null
    email: string
  }
}

const COOLDOWN_HOURS = 24

export async function createChatRequest(
  requesterId: string,
  recipientId: string
): Promise<ChatRequest | null> {
  // Check if request can be sent (cooldown logic)
  const canSend = await canSendRequest(requesterId, recipientId)
  if (!canSend) {
    console.error('Cannot send request: cooldown period not elapsed or request already exists')
    return null
  }

  // Check if conversation already exists
  const { data: existingConv } = await supabase
    .from('conversations')
    .select('id')
    .eq('is_group', false)
    .or(`and(user1_id.eq.${requesterId},user2_id.eq.${recipientId}),and(user1_id.eq.${recipientId},user2_id.eq.${requesterId})`)
    .single()

  if (existingConv) {
    console.error('Conversation already exists')
    return null
  }

  const { data, error } = await supabase
    .from('chat_requests')
    .insert({
      requester_id: requesterId,
      recipient_id: recipientId,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating chat request:', error)
    return null
  }

  // Fetch user details
  const request = await enrichRequestWithUsers(data)
  return request
}

export async function getPendingRequests(userId: string): Promise<ChatRequest[]> {
  const { data, error } = await supabase
    .from('chat_requests')
    .select('*')
    .eq('recipient_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching pending requests:', error)
    return []
  }

  const requests = await Promise.all((data || []).map(enrichRequestWithUsers))
  return requests
}

export async function getOutgoingRequests(userId: string): Promise<ChatRequest[]> {
  const { data, error } = await supabase
    .from('chat_requests')
    .select('*')
    .eq('requester_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching outgoing requests:', error)
    return []
  }

  const requests = await Promise.all((data || []).map(enrichRequestWithUsers))
  return requests
}

export async function acceptChatRequest(
  requestId: string,
  userId: string
): Promise<{ success: boolean; conversationId?: string }> {
  // Verify user is the recipient
  const { data: request, error: fetchError } = await supabase
    .from('chat_requests')
    .select('*')
    .eq('id', requestId)
    .eq('recipient_id', userId)
    .eq('status', 'pending')
    .single()

  if (fetchError || !request) {
    console.error('Error fetching request or unauthorized:', fetchError)
    return { success: false }
  }

  // Update request status
  const { error: updateError } = await supabase
    .from('chat_requests')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', requestId)

  if (updateError) {
    console.error('Error accepting request:', updateError)
    return { success: false }
  }

  // Create conversation
  const conversation = await createConversation(request.requester_id, request.recipient_id)
  
  if (!conversation) {
    console.error('Error creating conversation after accepting request')
    return { success: false }
  }

  return { success: true, conversationId: conversation.id }
}

export async function denyChatRequest(
  requestId: string,
  userId: string
): Promise<boolean> {
  // Verify user is the recipient
  const { data: request, error: fetchError } = await supabase
    .from('chat_requests')
    .select('*')
    .eq('id', requestId)
    .eq('recipient_id', userId)
    .eq('status', 'pending')
    .single()

  if (fetchError || !request) {
    console.error('Error fetching request or unauthorized:', fetchError)
    return false
  }

  const { error } = await supabase
    .from('chat_requests')
    .update({ 
      status: 'denied',
      denied_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId)

  if (error) {
    console.error('Error denying request:', error)
    return false
  }

  return true
}

export async function canSendRequest(
  requesterId: string,
  recipientId: string
): Promise<boolean> {
  if (requesterId === recipientId) {
    return false
  }

  // Check if there's already a pending request
  const { data: pendingRequest } = await supabase
    .from('chat_requests')
    .select('id')
    .eq('requester_id', requesterId)
    .eq('recipient_id', recipientId)
    .eq('status', 'pending')
    .single()

  if (pendingRequest) {
    return false
  }

  // Check if there's a denied request and if cooldown has elapsed
  const { data: deniedRequest } = await supabase
    .from('chat_requests')
    .select('denied_at')
    .eq('requester_id', requesterId)
    .eq('recipient_id', recipientId)
    .eq('status', 'denied')
    .order('denied_at', { ascending: false })
    .limit(1)
    .single()

  if (deniedRequest?.denied_at) {
    const deniedAt = new Date(deniedRequest.denied_at)
    const now = new Date()
    const hoursSinceDenied = (now.getTime() - deniedAt.getTime()) / (1000 * 60 * 60)
    
    if (hoursSinceDenied < COOLDOWN_HOURS) {
      return false
    }
  }

  // Check if conversation already exists
  const { data: existingConv } = await supabase
    .from('conversations')
    .select('id')
    .eq('is_group', false)
    .or(`and(user1_id.eq.${requesterId},user2_id.eq.${recipientId}),and(user1_id.eq.${recipientId},user2_id.eq.${requesterId})`)
    .single()

  if (existingConv) {
    return false
  }

  return true
}

export async function getCooldownRemaining(
  requesterId: string,
  recipientId: string
): Promise<number | null> {
  const { data: deniedRequest } = await supabase
    .from('chat_requests')
    .select('denied_at')
    .eq('requester_id', requesterId)
    .eq('recipient_id', recipientId)
    .eq('status', 'denied')
    .order('denied_at', { ascending: false })
    .limit(1)
    .single()

  if (!deniedRequest?.denied_at) {
    return null
  }

  const deniedAt = new Date(deniedRequest.denied_at)
  const now = new Date()
  const hoursSinceDenied = (now.getTime() - deniedAt.getTime()) / (1000 * 60 * 60)
  const hoursRemaining = COOLDOWN_HOURS - hoursSinceDenied

  if (hoursRemaining <= 0) {
    return null
  }

  return Math.ceil(hoursRemaining)
}

async function enrichRequestWithUsers(request: any): Promise<ChatRequest> {
  // Fetch requester details
  const { data: requester } = await supabase
    .from('users')
    .select('id, username, fullname, avatar_url, email')
    .eq('id', request.requester_id)
    .single()

  // Fetch recipient details
  const { data: recipient } = await supabase
    .from('users')
    .select('id, username, fullname, avatar_url, email')
    .eq('id', request.recipient_id)
    .single()

  return {
    id: request.id,
    requester_id: request.requester_id,
    recipient_id: request.recipient_id,
    status: request.status,
    created_at: request.created_at,
    updated_at: request.updated_at,
    denied_at: request.denied_at,
    requester: requester || {
      id: request.requester_id,
      username: null,
      fullname: null,
      avatar_url: null,
      email: '',
    },
    recipient: recipient || {
      id: request.recipient_id,
      username: null,
      fullname: null,
      avatar_url: null,
      email: '',
    },
  }
}

export function subscribeToChatRequests(
  userId: string,
  callback: (request: ChatRequest) => void
) {
  const channel = supabase
    .channel('chat-requests-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_requests',
        filter: `recipient_id=eq.${userId}`,
      },
      async (payload) => {
        const request = payload.new as any
        const enriched = await enrichRequestWithUsers(request)
        callback(enriched)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}


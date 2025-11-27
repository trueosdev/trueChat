import { supabase } from '../supabase/client'
import type { ConversationWithUser, ConversationParticipant } from '@/app/data'

export interface CreateGroupParams {
  name: string
  createdBy: string
  participantIds: string[]
}

export async function createGroupConversation(params: CreateGroupParams): Promise<ConversationWithUser | null> {
  const { name, createdBy, participantIds } = params

  // Create the group conversation
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .insert({
      is_group: true,
      name: name,
      created_by: createdBy,
      // For group chats, we don't use user1_id/user2_id, but they're required by schema
      user1_id: createdBy,
      user2_id: createdBy,
    })
    .select()
    .single()

  if (convError) {
    console.error('Error creating group conversation:', convError)
    return null
  }

  // First, add creator as admin (must be first so they can add others)
  const { error: creatorError } = await supabase
    .from('conversation_participants')
    .insert({
      conversation_id: conversation.id,
      user_id: createdBy,
      role: 'admin',
    })

  if (creatorError) {
    console.error('Error adding creator:', creatorError)
    // Rollback: delete the conversation
    await supabase.from('conversations').delete().eq('id', conversation.id)
    return null
  }

  // Then add other participants (now creator is admin and can add them)
  const otherParticipants = participantIds
    .filter(id => id !== createdBy)
    .map(userId => ({
      conversation_id: conversation.id,
      user_id: userId,
      role: 'member' as const,
    }))

  if (otherParticipants.length > 0) {
    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert(otherParticipants)

    if (participantsError) {
      console.error('Error adding participants:', participantsError)
      // Rollback: delete the conversation (will cascade delete participants)
      await supabase.from('conversations').delete().eq('id', conversation.id)
      return null
    }
  }

  // Fetch the complete conversation with participants
  return await getGroupConversationById(conversation.id)
}

export async function getGroupConversationById(conversationId: string): Promise<ConversationWithUser | null> {
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .eq('is_group', true)
    .single()

  if (convError) {
    console.error('Error fetching group conversation:', convError)
    return null
  }

  // Fetch participants with user details
  const { data: participants, error: partError } = await supabase
    .from('conversation_participants')
    .select('*')
    .eq('conversation_id', conversationId)

  if (partError) {
    console.error('Error fetching participants:', partError)
    return null
  }

  // Fetch user details for all participants
  const userIds = participants.map(p => p.user_id)
  const { data: users } = await supabase
    .from('users')
    .select('id, username, fullname, avatar_url, email')
    .in('id', userIds)

  const userMap = new Map((users || []).map((u: any) => [u.id, u]))

  const participantsWithUsers: ConversationParticipant[] = participants.map((p: any) => ({
    id: p.id,
    conversation_id: p.conversation_id,
    user_id: p.user_id,
    joined_at: p.joined_at,
    role: p.role,
    user: userMap.get(p.user_id) || {
      id: p.user_id,
      username: null,
      fullname: null,
      avatar_url: null,
      email: '',
    },
  }))

  return {
    id: conversation.id,
    created_at: conversation.created_at,
    user1_id: conversation.user1_id,
    user2_id: conversation.user2_id,
    is_group: conversation.is_group,
    name: conversation.name,
    created_by: conversation.created_by,
    last_message: conversation.last_message,
    participants: participantsWithUsers,
    participant_count: participantsWithUsers.length,
  }
}

export async function addParticipantToGroup(
  conversationId: string,
  userId: string,
  addedBy: string
): Promise<boolean> {
  // Check if the user adding is an admin
  const { data: adminCheck } = await supabase
    .from('conversation_participants')
    .select('role')
    .eq('conversation_id', conversationId)
    .eq('user_id', addedBy)
    .single()

  if (!adminCheck || adminCheck.role !== 'admin') {
    console.error('Only admins can add participants')
    return false
  }

  const { error } = await supabase
    .from('conversation_participants')
    .insert({
      conversation_id: conversationId,
      user_id: userId,
      role: 'member',
    })

  if (error) {
    console.error('Error adding participant:', error)
    return false
  }

  return true
}

export async function removeParticipantFromGroup(
  conversationId: string,
  userId: string,
  removedBy: string
): Promise<boolean> {
  // Check if the user removing is an admin or removing themselves
  if (userId !== removedBy) {
    const { data: adminCheck } = await supabase
      .from('conversation_participants')
      .select('role')
      .eq('conversation_id', conversationId)
      .eq('user_id', removedBy)
      .single()

    if (!adminCheck || adminCheck.role !== 'admin') {
      console.error('Only admins can remove participants')
      return false
    }
  }

  const { error } = await supabase
    .from('conversation_participants')
    .delete()
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error removing participant:', error)
    return false
  }

  return true
}

export async function updateParticipantRole(
  conversationId: string,
  userId: string,
  newRole: 'admin' | 'member',
  updatedBy: string
): Promise<boolean> {
  // Check if the user updating is an admin
  const { data: adminCheck } = await supabase
    .from('conversation_participants')
    .select('role')
    .eq('conversation_id', conversationId)
    .eq('user_id', updatedBy)
    .single()

  if (!adminCheck || adminCheck.role !== 'admin') {
    console.error('Only admins can update participant roles')
    return false
  }

  const { error } = await supabase
    .from('conversation_participants')
    .update({ role: newRole })
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error updating participant role:', error)
    return false
  }

  return true
}

export async function getGroupParticipants(conversationId: string): Promise<ConversationParticipant[]> {
  const { data: participants, error } = await supabase
    .from('conversation_participants')
    .select('*')
    .eq('conversation_id', conversationId)

  if (error) {
    console.error('Error fetching participants:', error)
    return []
  }

  // Fetch user details
  const userIds = participants.map(p => p.user_id)
  const { data: users } = await supabase
    .from('users')
    .select('id, username, fullname, avatar_url, email')
    .in('id', userIds)

  const userMap = new Map((users || []).map((u: any) => [u.id, u]))

  return participants.map((p: any) => ({
    id: p.id,
    conversation_id: p.conversation_id,
    user_id: p.user_id,
    joined_at: p.joined_at,
    role: p.role,
    user: userMap.get(p.user_id) || {
      id: p.user_id,
      username: null,
      fullname: null,
      avatar_url: null,
      email: '',
    },
  }))
}

export function subscribeToGroupParticipants(
  conversationId: string,
  callback: (participant: ConversationParticipant) => void
) {
  const channel = supabase
    .channel(`group-participants:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversation_participants',
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        const participant = payload.new as any
        const { data: user } = await supabase
          .from('users')
          .select('id, username, fullname, avatar_url, email')
          .eq('id', participant.user_id)
          .single()

        callback({
          id: participant.id,
          conversation_id: participant.conversation_id,
          user_id: participant.user_id,
          joined_at: participant.joined_at,
          role: participant.role,
          user: user || {
            id: participant.user_id,
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


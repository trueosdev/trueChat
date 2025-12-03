import { supabase } from '@/lib/supabase/client';
import type { ConversationWithUser, ConversationParticipant } from '@/lib/types';

export async function getConversations(userId: string): Promise<ConversationWithUser[]> {
  // Get 1-on-1 conversations
  const { data: directConversations, error: directError } = await supabase
    .from('conversations')
    .select('*')
    .eq('is_group', false)
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (directError) {
    console.error('Error fetching direct conversations:', directError);
  }

  // Get group conversations through participants table
  const { data: groupParticipants, error: groupError } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', userId);

  if (groupError) {
    console.error('Error fetching group participations:', groupError);
  }

  const groupConvIds = (groupParticipants || []).map((p: any) => p.conversation_id);
  
  let groupConversations: any[] = [];
  if (groupConvIds.length > 0) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('is_group', true)
      .in('id', groupConvIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching group conversations:', error);
    } else {
      groupConversations = data || [];
    }
  }

  const allConversations = [...(directConversations || []), ...groupConversations];

  // Fetch last messages for all conversations
  const conversationIds = allConversations.map((c: any) => c.id);
  
  const lastMessagesPromises = conversationIds.map(async (id: string) => {
    const { data } = await supabase
      .from('messages')
      .select('id, content, sender_id, created_at')
      .eq('conversation_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    return { conversationId: id, lastMessage: data };
  });

  const lastMessages = await Promise.all(lastMessagesPromises);
  const lastMessageMap = new Map(lastMessages.map((m) => [m.conversationId, m.lastMessage]));

  // Get other user details for direct conversations
  const otherUserIds = allConversations
    .filter((c: any) => !c.is_group)
    .map((c: any) => (c.user1_id === userId ? c.user2_id : c.user1_id));

  const { data: otherUsers } = await supabase
    .from('users')
    .select('id, username, fullname, avatar_url, email')
    .in('id', otherUserIds);

  const otherUserMap = new Map((otherUsers || []).map((u: any) => [u.id, u]));

  // Get participant details for group conversations
  const groupIds = allConversations.filter((c: any) => c.is_group).map((c: any) => c.id);
  
  let participantsMap = new Map<string, ConversationParticipant[]>();
  if (groupIds.length > 0) {
    const { data: allParticipants } = await supabase
      .from('conversation_participants')
      .select(`
        id,
        conversation_id,
        user_id,
        joined_at,
        role,
        user:users(id, username, fullname, avatar_url, email)
      `)
      .in('conversation_id', groupIds);

    if (allParticipants) {
      for (const p of allParticipants as any[]) {
        const convId = p.conversation_id;
        if (!participantsMap.has(convId)) {
          participantsMap.set(convId, []);
        }
        participantsMap.get(convId)!.push({
          id: p.id,
          conversation_id: p.conversation_id,
          user_id: p.user_id,
          joined_at: p.joined_at,
          role: p.role,
          user: p.user,
        });
      }
    }
  }

  // Build final conversation objects
  const result: ConversationWithUser[] = allConversations.map((conv: any) => {
    const lastMessage = lastMessageMap.get(conv.id);
    
    if (conv.is_group) {
      const participants = participantsMap.get(conv.id) || [];
      return {
        ...conv,
        last_message: lastMessage || null,
        participants,
        participant_count: participants.length,
      };
    } else {
      const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;
      const otherUser = otherUserMap.get(otherUserId);
      return {
        ...conv,
        last_message: lastMessage || null,
        other_user: otherUser || undefined,
      };
    }
  });

  // Sort by last message time or created_at
  result.sort((a, b) => {
    const aTime = a.last_message?.created_at || a.created_at;
    const bTime = b.last_message?.created_at || b.created_at;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  return result;
}

export async function createConversation(
  userId: string,
  otherUserId: string
): Promise<ConversationWithUser | null> {
  // Check if conversation already exists
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('is_group', false)
    .or(`and(user1_id.eq.${userId},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${userId})`)
    .single();

  if (existing) {
    // Fetch other user details
    const { data: otherUser } = await supabase
      .from('users')
      .select('id, username, fullname, avatar_url, email')
      .eq('id', otherUserId)
      .single();

    return {
      ...existing,
      last_message: null,
      other_user: otherUser || undefined,
    };
  }

  // Create new conversation
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user1_id: userId,
      user2_id: otherUserId,
      is_group: false,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    return null;
  }

  // Fetch other user details
  const { data: otherUser } = await supabase
    .from('users')
    .select('id, username, fullname, avatar_url, email')
    .eq('id', otherUserId)
    .single();

  return {
    ...data,
    last_message: null,
    other_user: otherUser || undefined,
  };
}

export function subscribeToConversations(
  userId: string,
  callback: (conversation: ConversationWithUser) => void
) {
  // Subscribe to new conversations where user is involved
  const channel = supabase
    .channel(`user_conversations:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'conversations',
      },
      async (payload) => {
        const conv = payload.new as any;
        if (conv.user1_id === userId || conv.user2_id === userId) {
          const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;
          const { data: otherUser } = await supabase
            .from('users')
            .select('id, username, fullname, avatar_url, email')
            .eq('id', otherUserId)
            .single();

          callback({
            ...conv,
            last_message: null,
            other_user: otherUser || undefined,
          });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}


import { supabase } from '../supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface UserPresence {
  user_id: string
  online_at: string
  username?: string
  fullname?: string
  avatar_url?: string
}

export interface TypingState {
  user_id: string
  conversation_id: string
  username?: string
  typing: boolean
}

export function subscribeToUserPresence(
  userId: string,
  callback: (presences: Record<string, UserPresence[]>) => void
): RealtimeChannel {
  const channel = supabase.channel('online-users', {
    config: {
      presence: {
        key: userId,
      },
    },
  })

  channel
    .on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState()
      callback(presenceState)
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Get current user info
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
            username: user.user_metadata?.username,
            fullname: user.user_metadata?.fullname,
            avatar_url: user.user_metadata?.avatar_url,
          })
        }
      }
    })

  return channel
}

export function subscribeToTypingIndicator(
  conversationId: string,
  currentUserId: string,
  callback: (typingUsers: TypingState[]) => void
): RealtimeChannel {
  const channel = supabase.channel(`typing:${conversationId}`, {
    config: {
      presence: {
        key: currentUserId,
      },
    },
  })

  channel
    .on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState()
      const typingUsers: TypingState[] = []
      
      Object.keys(presenceState).forEach((key) => {
        const presences = presenceState[key] as TypingState[]
        presences.forEach((presence) => {
          // Don't include current user
          if (presence.user_id !== currentUserId && presence.typing) {
            typingUsers.push(presence)
          }
        })
      })
      
      callback(typingUsers)
    })
    .subscribe()

  return channel
}

export async function broadcastTyping(
  channel: RealtimeChannel,
  userId: string,
  conversationId: string,
  typing: boolean,
  username?: string
) {
  await channel.track({
    user_id: userId,
    conversation_id: conversationId,
    username: username || 'User',
    typing,
  })
}

export function unsubscribeFromPresence(channel: RealtimeChannel) {
  supabase.removeChannel(channel)
}


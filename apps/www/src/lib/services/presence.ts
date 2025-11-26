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

// Track the CURRENT user's own presence
export function trackOwnPresence(
  currentUserId: string,
): RealtimeChannel {
  const channel = supabase.channel('online-users', {
    config: {
      presence: {
        key: currentUserId,
      },
    },
  })

  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await channel.track({
          user_id: currentUserId,
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

// Listen to ALL users' presence (just observe, don't track)
export function subscribeToPresence(
  callback: (presences: Record<string, UserPresence[]>) => void
): RealtimeChannel {
  const channel = supabase.channel('online-users')

  channel
    .on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState() as Record<string, UserPresence[]>
      callback(presenceState)
    })
    .subscribe()

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
      const presenceState = channel.presenceState() as Record<string, TypingState[]>
      const typingUsers: TypingState[] = []
      
      Object.keys(presenceState).forEach((key) => {
        const presences = presenceState[key]
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


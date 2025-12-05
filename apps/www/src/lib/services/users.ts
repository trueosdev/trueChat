import { supabase } from '../supabase/client'
import type { User } from '@/app/data'
import { getAvatarUrl } from '../utils'

export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('username', { ascending: true })

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  return (data || []).map((user) => ({
    id: user.id,
    name: user.fullname || user.username || user.email || 'Unknown',
    username: user.username,
    email: user.email,
    fullname: user.fullname,
    avatar: getAvatarUrl(user.avatar_url),
    avatar_url: user.avatar_url,
    bio: user.bio,
    messages: [],
  }))
}

export async function getUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching user:', error)
    return null
  }

  return {
    id: data.id,
    name: data.fullname || data.username || data.email || 'Unknown',
    username: data.username,
    email: data.email,
    fullname: data.fullname,
    avatar: getAvatarUrl(data.avatar_url),
    avatar_url: data.avatar_url,
    bio: data.bio,
    messages: [],
  }
}

export async function checkUsernameAvailability(username: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('usernames')
    .select('username')
    .eq('username', username.toLowerCase())
    .single()

  if (error && error.code === 'PGRST116') {
    // No rows returned, username is available
    return true
  }

  return false
}

export async function updateUserProfile(
  userId: string,
  updates: {
    username?: string
    fullname?: string
    avatar_url?: string
    bio?: string
  }
): Promise<boolean> {
  const { error } = await supabase.auth.updateUser({
    data: updates,
  })

  if (error) {
    console.error('Error updating user profile:', error)
    return false
  }

  return true
}


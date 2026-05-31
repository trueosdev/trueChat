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

/**
 * Whether the current user has completed trueChats onboarding, i.e. has a
 * row in truechats.members. Absence means "first use" -> onboarding.
 */
export async function hasMemberProfile(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('members')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error checking member profile:', error)
    return false
  }

  return !!data
}

/**
 * Create the trueChats member row during onboarding. Username is stored
 * lower-cased to match the case-insensitive uniqueness/availability checks.
 */
export async function createMemberProfile(
  userId: string,
  username: string,
  avatarUrl?: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from('members').insert({
    id: userId,
    username: username.toLowerCase(),
    avatar_url: avatarUrl ?? null,
  })

  if (error) {
    console.error('Error creating member profile:', error)
    // 23505 = unique_violation (username already taken).
    if (error.code === '23505') {
      return { ok: false, error: 'That username is already taken.' }
    }
    return { ok: false, error: error.message }
  }

  // Mirror the current user's own identity into auth user_metadata so the many
  // UI components that read user.user_metadata.{username,avatar_url} reflect it
  // immediately. The members/profiles tables remain the canonical source.
  await supabase.auth.updateUser({
    data: { username: username.toLowerCase(), avatar_url: avatarUrl ?? '' },
  })

  return { ok: true }
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
  // trueChats-specific identity (username, chat avatar, bio) lives in
  // truechats.members; shared trueOS identity (full name, shared avatar)
  // lives in trueos.profiles.
  const memberUpdates: Record<string, unknown> = {}
  if (updates.username !== undefined) memberUpdates.username = updates.username.toLowerCase()
  if (updates.avatar_url !== undefined) memberUpdates.avatar_url = updates.avatar_url
  if (updates.bio !== undefined) memberUpdates.bio = updates.bio

  if (Object.keys(memberUpdates).length > 0) {
    const { error } = await supabase
      .from('members')
      .update(memberUpdates)
      .eq('id', userId)
    if (error) {
      console.error('Error updating member profile:', error)
      return false
    }
  }

  if (updates.fullname !== undefined) {
    const { error } = await supabase
      .schema('trueos')
      .from('profiles')
      .update({ full_name: updates.fullname, updated_at: new Date().toISOString() })
      .eq('id', userId)
    if (error) {
      console.error('Error updating shared profile:', error)
      return false
    }
  }

  // Mirror into auth user_metadata for the current-user UI reads (see
  // createMemberProfile). Canonical data already written above.
  const metadata: Record<string, unknown> = {}
  if (updates.username !== undefined) metadata.username = updates.username.toLowerCase()
  if (updates.avatar_url !== undefined) metadata.avatar_url = updates.avatar_url
  if (updates.bio !== undefined) metadata.bio = updates.bio
  if (updates.fullname !== undefined) metadata.fullname = updates.fullname
  if (Object.keys(metadata).length > 0) {
    await supabase.auth.updateUser({ data: metadata })
  }

  return true
}


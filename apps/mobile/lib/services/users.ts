import { supabase } from '@/lib/supabase/client';

export interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  fullname: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

export async function searchUsers(query: string, currentUserId: string): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .neq('id', currentUserId)
    .or(`username.ilike.%${query}%,fullname.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(20);

  if (error) {
    console.error('Error searching users:', error);
    return [];
  }

  return data || [];
}

export async function getUserById(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data;
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, 'username' | 'fullname' | 'bio' | 'avatar_url'>>
): Promise<boolean> {
  // The users table is a view that reads from auth.users metadata
  // So we need to update the auth user metadata instead
  const { error } = await supabase.auth.updateUser({
    data: updates,
  });

  if (error) {
    console.error('Error updating user profile:', error);
    return false;
  }

  return true;
}

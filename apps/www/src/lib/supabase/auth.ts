import { supabase } from './client'

export async function signUp(email: string, password: string, username: string, fullname?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
      data: {
        username,
        fullname: fullname || '',
        avatar_url: '',
        bio: '',
      },
    },
  })
  return { data, error }
}

/**
 * Get email by username for login purposes
 * This function uses a database function to find the email associated with a username
 */
async function getEmailByUsername(username: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_email_by_username', {
    p_username: username,
  })

  if (error || !data) {
    return null
  }

  return data
}

/**
 * Sign in with either email or username
 * @param emailOrUsername - User's email address or username
 * @param password - User's password
 */
export async function signIn(emailOrUsername: string, password: string) {
  // Check if input looks like an email (contains @)
  const isEmail = emailOrUsername.includes('@')
  
  let email = emailOrUsername

  // If it's not an email, try to look up the email by username
  if (!isEmail) {
    const foundEmail = await getEmailByUsername(emailOrUsername)
    if (!foundEmail) {
      // Return an error if username not found
      return {
        data: null,
        error: {
          message: 'Invalid login credentials',
          name: 'AuthApiError',
          status: 400,
        } as any,
      }
    }
    email = foundEmail
  }

  // Sign in with the email
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}

export async function getUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}


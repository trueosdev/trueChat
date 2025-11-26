import { supabase } from '../supabase/client'

export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  try {
    // Generate a unique file name
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`

    // Upload the file to Supabase storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) {
      console.error('Error uploading avatar:', error)
      return null
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    return publicUrl
  } catch (error) {
    console.error('Error uploading avatar:', error)
    return null
  }
}

export async function deleteAvatar(url: string): Promise<boolean> {
  try {
    // Extract the file path from the URL
    const urlParts = url.split('/avatars/')
    if (urlParts.length < 2) return false
    
    const filePath = urlParts[1]

    const { error } = await supabase.storage
      .from('avatars')
      .remove([filePath])

    if (error) {
      console.error('Error deleting avatar:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting avatar:', error)
    return false
  }
}

export async function updateUserAvatar(userId: string, avatarUrl: string): Promise<boolean> {
  try {
    // Update the auth user metadata
    // Note: The 'users' table is actually a view that reads from auth.users.raw_user_meta_data
    // So we only need to update the auth user metadata, and the view will reflect the change
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        avatar_url: avatarUrl
      }
    })

    if (authError) {
      console.error('Error updating auth user:', authError)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating user avatar:', error)
    return false
  }
}


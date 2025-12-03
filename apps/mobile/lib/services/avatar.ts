import { supabase } from '@/lib/supabase/client';

export async function uploadAvatar(userId: string, fileUri: string, fileName: string): Promise<string | null> {
  try {
    // First, delete all old avatars for this user
    await deleteAllUserAvatars(userId);

    // Generate a unique file name
    const fileExt = fileName.split('.').pop() || 'jpg';
    const uniqueFileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

    // Determine the file type
    const fileType = fileExt === 'png' ? 'image/png' : 'image/jpeg';

    // For React Native, fetch the file and convert to ArrayBuffer
    const response = await fetch(fileUri);
    const arrayBuffer = await response.arrayBuffer();

    // Upload using Supabase storage client
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(uniqueFileName, arrayBuffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: fileType,
      });

    if (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(uniqueFileName);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return null;
  }
}

export async function deleteAvatar(url: string): Promise<boolean> {
  try {
    if (!url) return false;

    // Extract the file path from the URL
    // URL format: https://project.supabase.co/storage/v1/object/public/avatars/userId/avatar-123.jpg
    // We need: userId/avatar-123.jpg
    let filePath = '';
    
    // Try different URL formats
    if (url.includes('/avatars/')) {
      filePath = url.split('/avatars/')[1];
    } else if (url.includes('avatars/')) {
      filePath = url.split('avatars/')[1];
    } else {
      // If it's already a path
      filePath = url;
    }

    if (!filePath) {
      console.error('Could not extract file path from URL:', url);
      return false;
    }

    const { error } = await supabase.storage
      .from('avatars')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting avatar:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting avatar:', error);
    return false;
  }
}

export async function deleteAllUserAvatars(userId: string): Promise<boolean> {
  try {
    // List all files in the user's avatar folder
    const { data: files, error: listError } = await supabase.storage
      .from('avatars')
      .list(userId, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (listError) {
      console.error('Error listing avatars:', listError);
      return false;
    }

    if (!files || files.length === 0) {
      return true; // No files to delete
    }

    // Delete all files
    const filePaths = files.map((file) => `${userId}/${file.name}`);
    const { error: deleteError } = await supabase.storage
      .from('avatars')
      .remove(filePaths);

    if (deleteError) {
      console.error('Error deleting avatars:', deleteError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting all user avatars:', error);
    return false;
  }
}

export async function updateUserAvatar(userId: string, avatarUrl: string): Promise<boolean> {
  try {
    // Update the auth user metadata (users view reads from this)
    const { error } = await supabase.auth.updateUser({
      data: {
        avatar_url: avatarUrl,
      },
    });

    if (error) {
      console.error('Error updating auth user:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating user avatar:', error);
    return false;
  }
}

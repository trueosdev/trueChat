import { supabase } from '../supabase/client'

export interface AttachmentData {
  url: string
  type: string
  name: string
  size: number
}

export async function uploadAttachment(
  userId: string,
  file: File
): Promise<AttachmentData | null> {
  try {
    // Generate a unique file name
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}-${file.name}`

    // Upload the file to Supabase storage
    const { data, error } = await supabase.storage
      .from('attachments')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Error uploading attachment:', error)
      return null
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('attachments').getPublicUrl(fileName)

    return {
      url: publicUrl,
      type: file.type,
      name: file.name,
      size: file.size,
    }
  } catch (error) {
    console.error('Error uploading attachment:', error)
    return null
  }
}

export async function deleteAttachment(url: string): Promise<boolean> {
  try {
    // Extract the file path from the URL
    const urlParts = url.split('/attachments/')
    if (urlParts.length < 2) return false

    const filePath = urlParts[1]

    const { error } = await supabase.storage
      .from('attachments')
      .remove([filePath])

    if (error) {
      console.error('Error deleting attachment:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting attachment:', error)
    return false
  }
}

export function isImageFile(type: string): boolean {
  return type.startsWith('image/')
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export function getFileIcon(type: string): string {
  if (type.startsWith('image/')) return '🖼️'
  if (type.includes('pdf')) return '📄'
  if (type.includes('word')) return '📝'
  if (type.includes('excel') || type.includes('spreadsheet')) return '📊'
  if (type.includes('text')) return '📃'
  return '📎'
}


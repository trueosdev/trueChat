import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Check if env vars are missing or still have placeholder values
const isConfigured = supabaseUrl && 
                     supabaseAnonKey && 
                     supabaseUrl !== 'your_supabase_project_url' && 
                     supabaseAnonKey !== 'your_supabase_anon_key'

if (!isConfigured) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️  Supabase environment variables are not configured.')
    console.warn('⚠️  Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in apps/www/.env.local')
    console.warn('⚠️  See SUPABASE_SETUP.md for instructions.')
  }
}

// Create client with actual values or placeholders
// This allows the app to compile but operations will fail at runtime if not configured
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
)


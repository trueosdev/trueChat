export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string
          created_at: string
          user1_id: string
          user2_id: string
          is_group: boolean
          name: string | null
          created_by: string | null
          last_message: {
            id: string
            content: string
            sender_id: string
            created_at: string
          } | null
        }
        Insert: {
          id?: string
          created_at?: string
          user1_id?: string
          user2_id?: string
          is_group?: boolean
          name?: string | null
          created_by?: string | null
          last_message?: any
        }
        Update: {
          id?: string
          created_at?: string
          user1_id?: string
          user2_id?: string
          is_group?: boolean
          name?: string | null
          created_by?: string | null
          last_message?: any
        }
      }
      conversation_participants: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          joined_at: string
          role: 'admin' | 'member'
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          joined_at?: string
          role?: 'admin' | 'member'
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          joined_at?: string
          role?: 'admin' | 'member'
        }
      }
      messages: {
        Row: {
          id: string
          created_at: string
          sender_id: string
          conversation_id: string
          content: string
        }
        Insert: {
          id?: string
          created_at?: string
          sender_id?: string
          conversation_id: string
          content: string
        }
        Update: {
          id?: string
          created_at?: string
          sender_id?: string
          conversation_id?: string
          content?: string
        }
      }
    }
    Views: {
      users: {
        Row: {
          id: string
          email: string
          username: string | null
          fullname: string | null
          avatar_url: string | null
          bio: string | null
        }
      }
      usernames: {
        Row: {
          username: string
        }
      }
    }
  }
}

export type Conversation = Database['public']['Tables']['conversations']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type User = Database['public']['Views']['users']['Row']
export type Username = Database['public']['Views']['usernames']['Row']


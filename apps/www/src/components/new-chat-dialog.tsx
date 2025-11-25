"use client"

import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { Button } from './ui/button'
import { Avatar, AvatarImage } from './ui/avatar'
import { getUsers } from '@/lib/services/users'
import { createConversation } from '@/lib/services/conversations'
import { useAuth } from '@/hooks/useAuth'
import type { User } from '@/app/data'

interface NewChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConversationCreated: (conversationId: string) => void
}

export function NewChatDialog({ open, onOpenChange, onConversationCreated }: NewChatDialogProps) {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setLoading(true)
      getUsers().then((data) => {
        // Filter out current user
        const otherUsers = data.filter((u) => u.id !== user?.id)
        setUsers(otherUsers)
        setLoading(false)
      })
    }
  }, [open, user?.id])

  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase()
    return (
      u.username?.toLowerCase().includes(query) ||
      u.fullname?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query)
    )
  })

  const handleCreateConversation = async (otherUserId: string) => {
    if (!user) return

    setCreating(String(otherUserId))
    const conversation = await createConversation(String(user.id), String(otherUserId))
    
    if (conversation) {
      onConversationCreated(String(conversation.id))
      onOpenChange(false)
      setSearchQuery('')
    }
    
    setCreating(null)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-white/10">
      <div className="bg-white dark:bg-black border border-black dark:border-white rounded-lg shadow-lg w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-black dark:border-white">
          <h2 className="text-xl font-semibold text-black dark:text-white">New Chat</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8"
          >
            <X size={16} />
          </Button>
        </div>

        <div className="p-4 border-b border-black dark:border-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black dark:text-white" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-black dark:border-white rounded-md bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="loader"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-black dark:text-white">
              {searchQuery ? 'No users found' : 'No users available'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleCreateConversation(String(user.id))}
                  disabled={creating === String(user.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar_url || ''} alt={user.name} />
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-black dark:text-white">
                      {user.fullname || user.username || user.email}
                    </p>
                    {user.username && (
                      <p className="text-sm text-black/70 dark:text-white/70">@{user.username}</p>
                    )}
                  </div>
                  {creating === String(user.id) && (
                    <div className="flex items-center justify-center">
                      <div className="loader" style={{ width: '20px', height: '18px', border: '2px solid', padding: '0 3px' }}></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


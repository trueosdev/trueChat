"use client"

import { useState, useEffect } from 'react'
import { Search, X, Users } from 'lucide-react'
import { Button } from './ui/button'
import { Avatar, AvatarImage } from './ui/avatar'
import { getUsers } from '@/lib/services/users'
import { createGroupConversation } from '@/lib/services/groups'
import { useAuth } from '@/hooks/useAuth'
import type { User } from '@/app/data'

interface NewGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGroupCreated: (conversationId: string) => void
}

export function NewGroupDialog({ open, onOpenChange, onGroupCreated }: NewGroupDialogProps) {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [groupName, setGroupName] = useState('')
  const [step, setStep] = useState<'select' | 'name'>('select')

  useEffect(() => {
    if (open) {
      setLoading(true)
      getUsers().then((data) => {
        // Filter out current user
        const otherUsers = data.filter((u) => u.id !== user?.id)
        setUsers(otherUsers)
        setLoading(false)
      })
    } else {
      // Reset state when dialog closes
      setSearchQuery('')
      setSelectedUserIds(new Set())
      setGroupName('')
      setStep('select')
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

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUserIds)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUserIds(newSelected)
  }

  const handleNext = () => {
    if (selectedUserIds.size >= 1) {
      setStep('name')
    }
  }

  const handleCreateGroup = async () => {
    if (!user || !groupName.trim() || selectedUserIds.size < 1) return

    setCreating(true)
    const group = await createGroupConversation({
      name: groupName.trim(),
      createdBy: String(user.id),
      participantIds: Array.from(selectedUserIds),
    })
    
    if (group) {
      onGroupCreated(String(group.id))
      onOpenChange(false)
    }
    
    setCreating(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-white/10">
      <div className="bg-white dark:bg-black border border-black dark:border-white rounded-lg shadow-lg w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-black dark:border-white">
          <h2 className="text-xl font-semibold text-black dark:text-white">
            {step === 'select' ? 'New Group' : 'Name Your Group'}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8"
          >
            <X size={16} />
          </Button>
        </div>

        {step === 'select' ? (
          <>
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
              {selectedUserIds.size > 0 && (
                <div className="mt-3 flex items-center gap-2 text-sm text-black dark:text-white">
                  <Users size={16} />
                  <span>{selectedUserIds.size} selected</span>
                </div>
              )}
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
                  {filteredUsers.map((user) => {
                    const isSelected = selectedUserIds.has(String(user.id))
                    return (
                      <button
                        key={user.id}
                        onClick={() => toggleUserSelection(String(user.id))}
                        className={`w-full flex items-center gap-3 p-3 rounded-md transition-colors ${
                          isSelected 
                            ? 'bg-black/10 dark:bg-white/10' 
                            : 'hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar_url || ''} alt={user.name} />
                          </Avatar>
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-black dark:bg-white rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white dark:text-black" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-black dark:text-white">
                            {user.fullname || user.username || user.email}
                          </p>
                          {user.username && (
                            <p className="text-sm text-black/70 dark:text-white/70">@{user.username}</p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-black dark:border-white">
              <Button
                onClick={handleNext}
                disabled={selectedUserIds.size < 1}
                className="w-full"
              >
                Next ({selectedUserIds.size} selected)
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="p-4 space-y-4 flex-1">
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  placeholder="Enter group name..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full px-4 py-2 border border-black dark:border-white rounded-md bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                  autoFocus
                />
              </div>

              <div>
                <p className="text-sm font-medium text-black dark:text-white mb-2">
                  Members ({selectedUserIds.size + 1})
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 rounded-md bg-black/5 dark:bg-white/5">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar_url || ''} />
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-black dark:text-white">
                        You
                      </p>
                    </div>
                    <span className="text-xs text-black/70 dark:text-white/70">Admin</span>
                  </div>
                  {Array.from(selectedUserIds).map((userId) => {
                    const selectedUser = users.find(u => String(u.id) === userId)
                    if (!selectedUser) return null
                    return (
                      <div key={userId} className="flex items-center gap-2 p-2 rounded-md bg-black/5 dark:bg-white/5">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={selectedUser.avatar_url || ''} />
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-black dark:text-white">
                            {selectedUser.fullname || selectedUser.username || selectedUser.email}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-black dark:border-white flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setStep('select')}
                disabled={creating}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleCreateGroup}
                disabled={creating || !groupName.trim()}
                className="flex-1"
              >
                {creating ? 'Creating...' : 'Create Group'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}


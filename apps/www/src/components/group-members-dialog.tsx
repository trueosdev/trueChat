"use client"

import { useState, useEffect } from 'react'
import { X, UserPlus, MoreVertical, Shield, UserMinus, Search } from 'lucide-react'
import { Button } from './ui/button'
import { Avatar, AvatarImage } from './ui/avatar'
import { getAvatarUrl } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { getGroupParticipants, addParticipantToGroup, removeParticipantFromGroup, updateParticipantRole } from '@/lib/services/groups'
import { getUsers } from '@/lib/services/users'
import { useAuth } from '@/hooks/useAuth'
import type { ConversationParticipant } from '@/app/data'
import type { User } from '@/app/data'

interface GroupMembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationId: string
  conversationName: string
}

export function GroupMembersDialog({ open, onOpenChange, conversationId, conversationName }: GroupMembersDialogProps) {
  const { user } = useAuth()
  const [participants, setParticipants] = useState<ConversationParticipant[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [adding, setAdding] = useState(false)

  const currentUserParticipant = participants.find(p => p.user_id === user?.id)
  const isAdmin = currentUserParticipant?.role === 'admin'

  useEffect(() => {
    if (open) {
      loadParticipants()
    }
  }, [open, conversationId])

  const loadParticipants = async () => {
    setLoading(true)
    const data = await getGroupParticipants(conversationId)
    setParticipants(data)
    setLoading(false)
  }

  const loadAvailableUsers = async () => {
    const allUsers = await getUsers()
    const participantIds = new Set(participants.map(p => p.user_id))
    const available = allUsers.filter(u => !participantIds.has(String(u.id)) && String(u.id) !== user?.id)
    setAvailableUsers(available)
  }

  const handleAddMember = async (userId: string) => {
    if (!user) return
    setAdding(true)
    const success = await addParticipantToGroup(conversationId, userId, String(user.id))
    if (success) {
      await loadParticipants()
      setShowAddMember(false)
      setSearchQuery('')
    }
    setAdding(false)
  }

  const handleRemoveMember = async (userId: string) => {
    if (!user) return
    const success = await removeParticipantFromGroup(conversationId, userId, String(user.id))
    if (success) {
      await loadParticipants()
    }
  }

  const handleToggleAdmin = async (userId: string, currentRole: 'admin' | 'member') => {
    if (!user) return
    const newRole = currentRole === 'admin' ? 'member' : 'admin'
    const success = await updateParticipantRole(conversationId, userId, newRole, String(user.id))
    if (success) {
      await loadParticipants()
    }
  }

  const handleShowAddMember = () => {
    setShowAddMember(true)
    loadAvailableUsers()
  }

  const filteredUsers = availableUsers.filter((u) => {
    const query = searchQuery.toLowerCase()
    return (
      u.username?.toLowerCase().includes(query) ||
      u.fullname?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query)
    )
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-white/10">
      <div className="bg-white dark:bg-black border border-black dark:border-white rounded-lg shadow-lg w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-black dark:border-white">
          <div>
            <h2 className="text-xl font-semibold text-black dark:text-white">
              {showAddMember ? 'Add Member' : 'Group Members'}
            </h2>
            {!showAddMember && (
              <p className="text-sm text-black/70 dark:text-white/70">{conversationName}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (showAddMember) {
                setShowAddMember(false)
                setSearchQuery('')
              } else {
                onOpenChange(false)
              }
            }}
            className="h-8 w-8"
          >
            <X size={16} />
          </Button>
        </div>

        {showAddMember ? (
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
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-black dark:text-white">
                  {searchQuery ? 'No users found' : 'No users available to add'}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleAddMember(String(user.id))}
                      disabled={adding}
                      className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={getAvatarUrl(user.avatar_url)} alt={user.name} />
                      </Avatar>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-black dark:text-white">
                          {user.fullname || user.username || user.email}
                        </p>
                        {user.username && (
                          <p className="text-sm text-black/70 dark:text-white/70">@{user.username}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {isAdmin && (
              <div className="p-2 border-b border-black dark:border-white">
                <Button
                  onClick={handleShowAddMember}
                  variant="ghost"
                  className="w-full justify-start gap-2"
                >
                  <UserPlus size={16} />
                  Add Member
                </Button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="loader"></div>
                </div>
              ) : (
                <div className="space-y-1">
                  {participants.map((participant) => {
                    const isCurrentUser = participant.user_id === user?.id
                    const canManage = isAdmin && !isCurrentUser
                    
                    return (
                      <div
                        key={participant.id}
                        className="flex items-center gap-3 p-3 rounded-md"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={getAvatarUrl(participant.user.avatar_url)}
                            alt={participant.user.fullname || participant.user.username || ''}
                          />
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-black dark:text-white">
                              {participant.user.fullname || participant.user.username || participant.user.email}
                              {isCurrentUser && ' (You)'}
                            </p>
                            {participant.role === 'admin' && (
                              <Shield size={14} className="text-black/70 dark:text-white/70" />
                            )}
                          </div>
                          {participant.user.username && (
                            <p className="text-sm text-black/70 dark:text-white/70">
                              @{participant.user.username}
                            </p>
                          )}
                        </div>
                        
                        {canManage && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleToggleAdmin(participant.user_id, participant.role)}
                              >
                                <Shield size={14} className="mr-2" />
                                {participant.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleRemoveMember(participant.user_id)}
                                className="text-red-600 dark:text-red-400"
                              >
                                <UserMinus size={14} className="mr-2" />
                                Remove from Group
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}

                        {isCurrentUser && isAdmin && (
                          <span className="text-xs text-black/70 dark:text-white/70">Admin</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}


"use client"

import React, { useState, useEffect } from 'react'
import { X, UserPlus, Search, Save, 
  Users, UserCircle, UserPlus as UserPlusIcon, UsersRound,
  MessageCircle, MessagesSquare, Hash, Tag, AtSign,
  Heart, Star, Crown, Trophy, Coffee, Pizza, Gamepad2, Music,
  Briefcase, GraduationCap, Building, Home, Car, Plane, Ship,
  Camera, Image, Film, Video, Mic, Headphones, Radio,
  Book, BookOpen, GraduationCap as GradCap, School,
  Code, Terminal, Cpu, Smartphone, Laptop, Monitor,
  Palette, Paintbrush, Brush, Sparkles, Zap, Flame,
  Globe, Map, MapPin, Navigation, Compass,
  Calendar, Clock, Timer, Bell, BellRing,
  Lock, Shield, Key, Eye, EyeOff,
  Settings, Wrench, Hammer, Cog,
  Folder, FileText, File, FolderOpen, Archive,
  Mail, Inbox, Send, MessageSquare, Phone,
  Github, Twitter, Instagram, Facebook, Linkedin,
  DollarSign, CreditCard, Wallet, TrendingUp, BarChart,
  ShoppingBag, ShoppingCart, Store, Package,
  Heart as HeartIcon, Smile, Laugh, ThumbsUp, Award
} from 'lucide-react'
import { Button } from './ui/button'
import { Avatar, AvatarImage } from './ui/avatar'
import { getAvatarUrl } from '@/lib/utils'
import { updateGroupName, addParticipantToGroup, getGroupParticipants } from '@/lib/services/groups'
import { getUsers } from '@/lib/services/users'
import { useAuth } from '@/hooks/useAuth'
import type { User } from '@/app/data'
import * as LucideIcons from 'lucide-react'

// Curated list of popular icons for groups
const POPULAR_ICONS = [
  'Users', 'UserCircle', 'UserPlus', 'UsersRound',
  'MessageCircle', 'MessagesSquare', 'Hash', 'Tag', 'AtSign',
  'Heart', 'Star', 'Crown', 'Trophy', 'Award',
  'Coffee', 'Pizza', 'Gamepad2', 'Music', 'Headphones',
  'Briefcase', 'GraduationCap', 'Building', 'School',
  'Home', 'Car', 'Plane', 'Ship',
  'Camera', 'Image', 'Film', 'Video', 'Mic', 'Radio',
  'Book', 'BookOpen', 'Code', 'Terminal', 'Cpu',
  'Smartphone', 'Laptop', 'Monitor',
  'Palette', 'Paintbrush', 'Brush', 'Sparkles', 'Zap', 'Flame',
  'Globe', 'Map', 'MapPin', 'Navigation', 'Compass',
  'Calendar', 'Clock', 'Timer', 'Bell', 'BellRing',
  'Lock', 'Shield', 'Key', 'Eye',
  'Settings', 'Wrench', 'Hammer', 'Cog',
  'Folder', 'FileText', 'File', 'FolderOpen', 'Archive',
  'Mail', 'Inbox', 'Send', 'MessageSquare', 'Phone',
  'Github', 'Twitter', 'Instagram', 'Facebook', 'Linkedin',
  'DollarSign', 'CreditCard', 'Wallet', 'TrendingUp', 'BarChart',
  'ShoppingBag', 'ShoppingCart', 'Store', 'Package',
  'Smile', 'Laugh', 'ThumbsUp'
] as const

type IconName = typeof POPULAR_ICONS[number]

interface EditGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  conversationId: string
  currentName: string
  currentIcon?: string | null
  onGroupUpdated?: () => void
}

export function EditGroupDialog({ 
  open, 
  onOpenChange, 
  conversationId, 
  currentName,
  currentIcon,
  onGroupUpdated 
}: EditGroupDialogProps) {
  const { user } = useAuth()
  const [groupName, setGroupName] = useState(currentName)
  const [showAddUser, setShowAddUser] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [participants, setParticipants] = useState<string[]>([])
  const [groupIcon, setGroupIcon] = useState<IconName>((currentIcon && POPULAR_ICONS.includes(currentIcon as IconName)) ? currentIcon as IconName : 'Users')
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [iconSearch, setIconSearch] = useState('')

  useEffect(() => {
    if (open) {
      setGroupName(currentName)
      setGroupIcon((currentIcon && POPULAR_ICONS.includes(currentIcon as IconName)) ? currentIcon as IconName : 'Users')
      setShowAddUser(false)
      setSearchQuery('')
      setError(null)
      setShowIconPicker(false)
      setIconSearch('')
      loadParticipants()
    }
  }, [open, currentName, currentIcon, conversationId])

  const filteredIcons = POPULAR_ICONS.filter(iconName =>
    iconName.toLowerCase().includes(iconSearch.toLowerCase())
  )

  const loadParticipants = async () => {
    const data = await getGroupParticipants(conversationId)
    setParticipants(data.map(p => p.user_id))
  }

  const loadAvailableUsers = async () => {
    const allUsers = await getUsers()
    const participantIds = new Set(participants)
    const available = allUsers.filter(
      u => !participantIds.has(String(u.id)) && String(u.id) !== user?.id
    )
    setAvailableUsers(available)
  }

  const handleSave = async () => {
    if (!user || !groupName.trim()) {
      setError('Group name cannot be empty')
      return
    }

    setSaving(true)
    setError(null)
    
    const success = await updateGroupName(conversationId, groupName.trim(), String(user.id), groupIcon)
    
    if (success) {
      onGroupUpdated?.()
      onOpenChange(false)
    } else {
      setError('Failed to update group name. Please try again.')
    }
    
    setSaving(false)
  }

  const handleAddUser = async (userId: string) => {
    if (!user) return
    setAdding(true)
    setError(null)
    
    const success = await addParticipantToGroup(conversationId, userId, String(user.id))
    
    if (success) {
      // Add to participants list and remove from available list
      setParticipants(prev => [...prev, userId])
      setAvailableUsers(prev => prev.filter(u => String(u.id) !== userId))
      setSearchQuery('')
      onGroupUpdated?.()
    } else {
      setError('Failed to add user. Please try again.')
    }
    
    setAdding(false)
  }

  const handleShowAddUser = () => {
    setShowAddUser(true)
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
              {showAddUser ? 'Add Users' : 'Edit Group'}
            </h2>
            {!showAddUser && (
              <p className="text-sm text-black/70 dark:text-white/70">Update group settings</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (showAddUser) {
                setShowAddUser(false)
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

        {showAddUser ? (
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
                      onClick={() => handleAddUser(String(user.id))}
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                  Group Icon
                </label>
                <button
                  type="button"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="w-full px-4 py-3 border border-black dark:border-white rounded-md bg-white dark:bg-black text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
                >
                  {(() => {
                    const IconComponent = LucideIcons[groupIcon as keyof typeof LucideIcons] as React.ComponentType<{ size?: number; className?: string }>
                    return IconComponent ? <IconComponent size={20} /> : <Users size={20} />
                  })()}
                  <span className="text-sm">{groupIcon}</span>
                </button>
                
                {showIconPicker && (
                  <div className="mt-2 border border-black dark:border-white rounded-md p-4 bg-white dark:bg-black">
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black dark:text-white" />
                      <input
                        type="text"
                        placeholder="Search icons..."
                        value={iconSearch}
                        onChange={(e) => setIconSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-black dark:border-white rounded-md bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white text-sm"
                        autoFocus
                      />
                    </div>
                    <div className="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto p-1">
                      {filteredIcons.map((iconName) => {
                        const IconComponent = LucideIcons[iconName as keyof typeof LucideIcons] as React.ComponentType<{ size?: number; className?: string }>
                        const isSelected = groupIcon === iconName
                        return (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => {
                              setGroupIcon(iconName)
                              setShowIconPicker(false)
                              setIconSearch('')
                            }}
                            className={`p-2 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-center relative ${
                              isSelected ? 'bg-black/5 dark:bg-white/5' : ''
                            }`}
                            title={iconName}
                          >
                            {isSelected && (
                              <div className="absolute inset-0 border-2 border-black dark:border-white rounded-md" />
                            )}
                            {IconComponent ? <IconComponent size={18} /> : <Users size={18} />}
                          </button>
                        )
                      })}
                    </div>
                    {filteredIcons.length === 0 && (
                      <div className="text-center py-4 text-sm text-black/70 dark:text-white/70">
                        No icons found
                      </div>
                    )}
                  </div>
                )}
              </div>

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
                />
              </div>

              <div>
                <Button
                  onClick={handleShowAddUser}
                  variant="ghost"
                  className="w-full justify-start gap-2"
                >
                  <UserPlus size={16} />
                  Add More Users
                </Button>
              </div>
            </div>

            <div className="p-4 border-t border-black dark:border-white flex gap-2">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !groupName.trim()}
                className="flex-1 gap-2"
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}


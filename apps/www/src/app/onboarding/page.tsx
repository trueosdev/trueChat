"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { supabase } from '@/lib/supabase/client'
import { checkUsernameAvailability, createMemberProfile } from '@/lib/services/users'
import { uploadAvatar } from '@/lib/services/avatar'
import { Button } from '@/components/ui/button'

export default function OnboardingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Require auth; pull shared trueOS identity (name/email) for the greeting.
  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push('/auth/login')
      return
    }
    let active = true
    supabase
      .schema('trueos')
      .from('profiles')
      .select('full_name, email, avatar_url')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active || !data) return
        setFullName(data.full_name ?? '')
        setEmail(data.email ?? '')
        if (data.avatar_url) setAvatarPreview(data.avatar_url)
      })
    return () => {
      active = false
    }
  }, [user, loading, router])

  // Debounced username availability check.
  useEffect(() => {
    if (username.length < 3) {
      setUsernameAvailable(null)
      return
    }
    setCheckingUsername(true)
    const id = setTimeout(async () => {
      const available = await checkUsernameAvailability(username)
      setUsernameAvailable(available)
      setCheckingUsername(false)
    }, 500)
    return () => clearTimeout(id)
  }, [username])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!user) return
    if (!usernameAvailable) {
      setError('Please choose an available username.')
      return
    }

    setSubmitting(true)

    let avatarUrl: string | null = null
    if (avatarFile) {
      avatarUrl = await uploadAvatar(user.id, avatarFile)
      if (!avatarUrl) {
        setError('Could not upload your profile picture. Please try again.')
        setSubmitting(false)
        return
      }
    }

    const { ok, error: createError } = await createMemberProfile(user.id, username, avatarUrl)
    if (!ok) {
      setError(createError ?? 'Something went wrong. Please try again.')
      setSubmitting(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="loader mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg shadow-lg p-8 space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-black dark:text-white">
              Welcome to trueChats
            </h1>
            <p className="mt-2 text-black dark:text-white">
              {fullName ? `Hi ${fullName}, ` : ''}finish setting up your profile.
            </p>
            {email && (
              <p className="mt-1 text-sm text-black/60 dark:text-white/60">{email}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-black dark:text-white bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-md">
                {error}
              </div>
            )}

            <div className="flex flex-col items-center space-y-3">
              <div className="h-20 w-20 rounded-full overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <label className="text-sm underline cursor-pointer text-black dark:text-white">
                Choose a profile picture
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2 text-black dark:text-white">
                Username
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  required
                  minLength={3}
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-md bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20"
                  placeholder="johndoe"
                />
                {username.length >= 3 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {checkingUsername ? (
                      <div className="animate-spin rounded-full h-4 w-4 border border-black/20 dark:border-white/20 border-t-black/50 dark:border-t-white/50"></div>
                    ) : usernameAvailable === true ? (
                      <span className="text-black dark:text-white text-sm">✓</span>
                    ) : usernameAvailable === false ? (
                      <span className="text-black dark:text-white text-sm">✗</span>
                    ) : null}
                  </div>
                )}
              </div>
              {username.length >= 3 && usernameAvailable === false && (
                <p className="mt-1 text-sm text-black dark:text-white">
                  Username is already taken
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={submitting || usernameAvailable !== true}
            >
              {submitting ? 'Setting up...' : 'Enter trueChats'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

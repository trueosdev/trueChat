"use client"

import { useAuth } from './auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { hasMemberProfile } from '@/lib/services/users'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  // null = not checked yet, true/false = onboarding completed or not.
  const [onboarded, setOnboarded] = useState<boolean | null>(null)

  // Redirect unauthenticated users to login.
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  // Once authenticated, gate on trueChats onboarding: a user signed in with
  // trueOS but without a truechats.members row hasn't picked a username yet.
  useEffect(() => {
    let active = true
    if (loading || !user) {
      setOnboarded(null)
      return
    }
    hasMemberProfile(user.id).then((exists) => {
      if (!active) return
      if (!exists) {
        router.push('/onboarding')
      }
      setOnboarded(exists)
    })
    return () => {
      active = false
    }
  }, [user, loading, router])

  // Show the loader while resolving auth or the onboarding check.
  if (loading || (user && onboarded === null)) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="text-center">
          <div className="loader mx-auto"></div>
        </div>
      </div>
    )
  }

  if (!user || onboarded === false) {
    return null
  }

  return <>{children}</>
}

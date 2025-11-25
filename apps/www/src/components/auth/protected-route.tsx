"use client"

import { useAuth } from './auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="text-center">
          <div className="loader mx-auto"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}


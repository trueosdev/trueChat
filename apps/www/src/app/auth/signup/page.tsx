"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUp } from '@/lib/supabase/auth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullname, setFullname] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    setLoading(true)

    const { error } = await signUp(email, password, fullname)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // New accounts have no trueChats member row yet; middleware routes
      // them through /onboarding to pick a username + profile picture.
      router.push('/onboarding')
      router.refresh()
    }
  }

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg shadow-lg p-8 space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-black dark:text-white">Create an account</h1>
            <p className="mt-2 text-black dark:text-white">
              Sign up to start chatting
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-black dark:text-white bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-black dark:text-white">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-md bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="fullname" className="block text-sm font-medium mb-2 text-black dark:text-white">
                Full Name (optional)
              </label>
              <input
                id="fullname"
                type="text"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-md bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-black dark:text-white">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-md bg-white dark:bg-black text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-black/20 dark:focus:ring-white/20"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-black dark:text-white">
                Must be at least 6 characters
              </p>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign up'}
          </Button>

          <p className="text-center text-sm text-black dark:text-white">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-black dark:text-white underline hover:no-underline">
              Sign in
            </Link>
          </p>
        </form>
        </div>
      </div>
    </div>
  )
}


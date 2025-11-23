// src/app/reset-password/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handlePasswordReset = async () => {
      try {
        setLoading(true)
        
        // Get the hash from the URL (Supabase puts tokens in the hash fragment)
        const hash = window.location.hash
        console.log('URL hash:', hash)
        
        if (!hash) {
          setError('No reset token found in URL. Please use the link from your email.')
          setIsValidToken(false)
          return
        }

        // Check if we're in a recovery flow by looking for recovery tokens
        const urlParams = new URLSearchParams(hash.substring(1)) // Remove the # and parse
        const type = urlParams.get('type')
        const accessToken = urlParams.get('access_token')
        const refreshToken = urlParams.get('refresh_token')
        
        console.log('Recovery flow params:', { type, accessToken: !!accessToken, refreshToken: !!refreshToken })

        if (type === 'recovery' && accessToken) {
          // We're in a password reset flow, set the session
          const { data: { session }, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          })

          if (sessionError) {
            console.error('Session error:', sessionError)
            throw new Error('Invalid or expired reset link. Please request a new one.')
          }

          if (session) {
            console.log('Recovery session established')
            setIsValidToken(true)
          } else {
            throw new Error('Failed to establish recovery session')
          }
        } else {
          throw new Error('Invalid reset link format')
        }
        
      } catch (err: any) {
        console.error('Token validation error:', err)
        setError(err.message || 'Invalid or expired reset link. Please request a new reset link.')
        setIsValidToken(false)
      } finally {
        setLoading(false)
      }
    }

    handlePasswordReset()
  }, [supabase.auth])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Update the user's password using the recovery session
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) {
        throw updateError
      }

      setMessage('Password updated successfully! Redirecting to login...')
      
      // Sign out the recovery session and redirect to login
      await supabase.auth.signOut()
      
      setTimeout(() => {
        router.push('/login')
      }, 2000)

    } catch (err: any) {
      console.error('Password reset error:', err)
      setError(err.message || 'Failed to reset password. Please try again or request a new reset link.')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestNewLink = () => {
    router.push('/forgot-password')
  }

  // Show loading while checking token
  if (loading && isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Setting up password reset...</p>
        </div>
      </div>
    )
  }

  // Show error if invalid token
  if (isValidToken === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Invalid Reset Link</h2>
            <p className="mt-2 text-sm text-gray-600">
              {error || 'This password reset link is invalid or has expired.'}
            </p>
          </div>
          
          <div className="mt-8 space-y-4">
            <button
              onClick={handleRequestNewLink}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Request New Reset Link
            </button>
            
            <button
              onClick={() => router.push('/login')}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Show password reset form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Set New Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please enter your new password below
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {message && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-700">{message}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
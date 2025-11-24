// src/app/auth/callback/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Processing reset link...')
  const supabase = createClient()

  useEffect(() => {
    const handleCallback = async () => {
      console.log('=== AUTH CALLBACK CLIENT ===')
      console.log('Full URL:', window.location.href)
      console.log('Search params:', Object.fromEntries(searchParams.entries()))

      try {
        // Use Supabase's built-in auth code exchange
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href)
        
        if (error) {
          console.error('Code exchange error:', error)
          throw error
        }

        if (data?.session) {
          console.log('✓ Session established via code exchange')
          setStatus('Password reset ready...')
          
          // Redirect to reset password page
          router.replace('/reset-password?verified=true')
          return
        }

        // Fallback: Check for hash parameters
        if (window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          const tokenType = hashParams.get('type')
          
          if (tokenType === 'recovery' && accessToken) {
            setStatus('Setting up password reset...')
            console.log('✓ Password reset flow detected (hash tokens)')
            
            const resetUrl = new URL('/reset-password', window.location.origin)
            resetUrl.searchParams.set('access_token', accessToken)
            if (refreshToken) {
              resetUrl.searchParams.set('refresh_token', refreshToken)
            }
            resetUrl.searchParams.set('type', 'recovery')
            
            router.replace(resetUrl.toString())
            return
          }
        }

        // Check if we already have a session
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          console.log('✓ Existing session found')
          router.replace('/reset-password?verified=true')
          return
        }

        throw new Error('No valid authentication found')

      } catch (error) {
        console.error('Callback error:', error)
        setStatus('Invalid reset link...')
        
        setTimeout(() => {
          router.replace('/login?message=Invalid or expired reset link. Please try again.')
        }, 2000)
      }
    }

    handleCallback()
  }, [router, searchParams, supabase.auth])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">{status}</p>
      </div>
    </div>
  )
}

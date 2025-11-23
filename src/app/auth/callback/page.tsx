// src/app/auth/callback/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const processCallback = () => {
      console.log('Processing Supabase callback...')
      console.log('Full URL:', window.location.href)
      console.log('URL hash:', window.location.hash)

      // Extract parameters from URL hash (Supabase puts them here)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const tokenType = hashParams.get('token_type')
      const type = hashParams.get('type')
      const expiresIn = hashParams.get('expires_in')

      console.log('Hash parameters:', {
        accessToken: accessToken ? 'present' : 'missing',
        refreshToken: refreshToken ? 'present' : 'missing',
        tokenType,
        type,
        expiresIn
      })

      // Handle password reset flow
      if (type === 'recovery' && accessToken) {
        console.log('Password reset flow detected')
        
        // Redirect to reset-password with the access token
        const resetUrl = new URL('/reset-password', window.location.origin)
        resetUrl.searchParams.set('access_token', accessToken)
        if (refreshToken) resetUrl.searchParams.set('refresh_token', refreshToken)
        resetUrl.searchParams.set('type', 'recovery')
        
        console.log('Redirecting to:', resetUrl.toString())
        router.replace(resetUrl.toString())
        return
      }

      // Handle other flows (email verification, etc.)
      console.log('Unsupported flow or missing parameters')
      router.replace('/auth/auth-code-error?error=unsupported_flow')
    }

    processCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Processing...</p>
      </div>
    </div>
  )
}
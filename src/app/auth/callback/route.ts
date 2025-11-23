// src/app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const type = searchParams.get('type')

  console.log('Auth callback called with:', {
    code: code ? 'present' : 'missing',
    next,
    type,
    fullUrl: request.url
  })

  if (code) {
    const supabase = await createClient()
    
    // Exchange the auth code for a user session
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    console.log('Code exchange result:', { error, user: data?.user?.id })
    
    if (!error) {
      // Get the current session to verify
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Session after exchange:', session ? 'present' : 'missing')
      
      // For password reset, always redirect to reset-password
      if (type === 'recovery' || next.includes('reset-password')) {
        console.log('Redirecting to reset-password page')
        return NextResponse.redirect(new URL('/reset-password', request.url))
      }
      
      // Successful login! Redirect to the intended page
      console.log('Redirecting to:', next)
      return NextResponse.redirect(new URL(next, request.url))
    } else {
      console.error('Error exchanging code:', error)
    }
  }

  // If we have no code, or the exchange failed, redirect to an error page
  console.log('Redirecting to auth error page')
  return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
}
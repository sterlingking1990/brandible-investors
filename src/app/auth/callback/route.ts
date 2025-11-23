// src/app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const { searchParams } = requestUrl
  const code = searchParams.get('code')
  const token = searchParams.get('token')
  const next = searchParams.get('next') ?? '/'
  const type = searchParams.get('type')

  console.log('Auth callback received:', { code, token, next, type })

  // Handle password reset flow - be more specific about the conditions
  const isRecoveryFlow = type === 'recovery' || next.includes('reset-password') || token !== null

  if (isRecoveryFlow) {
    console.log('Processing recovery flow')
    
    if (token) {
      console.log('Token found, redirecting to reset-password with token')
      const resetPasswordUrl = new URL('/reset-password', requestUrl.origin)
      resetPasswordUrl.searchParams.set('token', token)
      resetPasswordUrl.searchParams.set('type', 'recovery')
      return NextResponse.redirect(resetPasswordUrl)
    } else if (code) {
      console.log('Code found, exchanging code for session')
      const supabase = await createClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        console.log('Code exchange successful, redirecting to reset-password')
        const resetPasswordUrl = new URL('/reset-password', requestUrl.origin)
        return NextResponse.redirect(resetPasswordUrl)
      } else {
        console.log('Code exchange error:', error)
        return NextResponse.redirect(new URL('/auth/auth-code-error', requestUrl.origin))
      }
    } else {
      console.log('No token or code found in recovery flow')
      return NextResponse.redirect(new URL('/auth/auth-code-error', requestUrl.origin))
    }
  }

  // Handle regular OAuth flow (with code)
  if (code) {
    console.log('Processing regular OAuth flow')
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      console.log('OAuth successful, redirecting to:', next)
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    } else {
      console.log('OAuth error:', error)
      return NextResponse.redirect(new URL('/auth/auth-code-error', requestUrl.origin))
    }
  }

  // If there's an error or no code, redirect to an error page
  console.log('Final fallback - no valid parameters found')
  return NextResponse.redirect(new URL('/auth/auth-code-error', requestUrl.origin))
}
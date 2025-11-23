// src/app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const token = searchParams.get('token') // ← Add this
  const next = searchParams.get('next') ?? '/'
  const type = searchParams.get('type')

  // Handle password reset flow (using token instead of code)
  if (type === 'recovery' || next.includes('reset-password')) {
    if (token) {
      // For token-based verification, redirect directly to reset-password
      const resetPasswordUrl = new URL('/reset-password', request.url)
      resetPasswordUrl.searchParams.set('token', token)
      resetPasswordUrl.searchParams.set('type', 'recovery')
      return NextResponse.redirect(resetPasswordUrl)
    } else if (code) {
      // If there's a code (older flow), use exchangeCodeForSession
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        const resetPasswordUrl = new URL('/reset-password', request.url)
        return NextResponse.redirect(resetPasswordUrl)
      }
    }
    
    // If neither token nor code, go to error
    return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
  }

  // Handle regular OAuth flow (with code)
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  // If there's an error or no code, redirect to an error page
  return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
}
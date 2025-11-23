// src/app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const type = searchParams.get('type')

  // For password reset, redirect to the reset-password page
  // The client-side will handle the session from the URL hash
  if (type === 'recovery' || next.includes('reset-password')) {
    const resetPasswordUrl = new URL('/reset-password', request.url)
    return NextResponse.redirect(resetPasswordUrl)
  }

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
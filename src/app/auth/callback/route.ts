// src/app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const { searchParams } = requestUrl
  const code = searchParams.get('code')
  
  console.log('Auth callback called with URL:', requestUrl.toString())

  if (code) {
    console.log('Exchanging code for session')
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code:', error)
      return NextResponse.redirect(new URL('/auth/auth-code-error', requestUrl.origin))
    }

    console.log('Code exchange successful, redirecting to reset-password')
    // Redirect to reset-password after successful session establishment
    return NextResponse.redirect(new URL('/reset-password', requestUrl.origin))
  }

  // If no code, redirect to error
  console.log('No code parameter found')
  return NextResponse.redirect(new URL('/auth/auth-code-error', requestUrl.origin))
}
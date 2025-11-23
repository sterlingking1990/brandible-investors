// src/app/auth/callback/route.ts - Alternative version
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const { searchParams } = requestUrl
  const token = searchParams.get('token')
  const type = searchParams.get('type')
  
  console.log('Auth callback parameters:', { token: token ? 'present' : 'missing', type })

  // Handle password reset flow
  if (type === 'recovery' && token) {
    console.log('Password reset flow detected, redirecting to reset-password with token')
    
    // Simply pass the token to the reset-password page
    const resetPasswordUrl = new URL('/reset-password', requestUrl.origin)
    resetPasswordUrl.searchParams.set('token', token)
    resetPasswordUrl.searchParams.set('type', 'recovery')
    return NextResponse.redirect(resetPasswordUrl)
  }

  // Handle other cases
  console.log('Invalid callback parameters')
  return NextResponse.redirect(new URL('/auth/auth-code-error', requestUrl.origin))
}
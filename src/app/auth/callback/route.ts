import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token = searchParams.get('token')
  const type = searchParams.get('type')

  console.log('Auth callback - params:', { code: !!code, token: !!token, type })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Handle cookie setting for the response
        },
        remove(name: string, options: CookieOptions) {
          // Handle cookie removal for the response
        },
      },
    }
  )

  // Handle code exchange (modern flow)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      console.log('✓ Code exchange successful')
      return NextResponse.redirect(`${origin}/reset-password?verified=true`)
    }
    console.error('Code exchange failed:', error)
  }

  // Handle token verification (fallback for older flow)
  if (token && type === 'recovery') {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery'
      })
      if (!error) {
        console.log('✓ Token verification successful')
        return NextResponse.redirect(`${origin}/reset-password?verified=true`)
      }
      console.error('Token verification failed:', error)
    } catch (err) {
      console.error('Token verification error:', err)
    }
  }

  // Fallback - redirect to login with error
  return NextResponse.redirect(`${origin}/login?message=Invalid or expired reset link. Please try again.`)
}

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    console.log('=== AUTH CALLBACK HIT ===')
    
    const { searchParams } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type')
    const next = searchParams.get('next') ?? '/'

    console.log('Params:', { 
      token_hash: token_hash?.substring(0, 10) + '...', 
      type, 
      next 
    })

    if (token_hash && type) {
      console.log('Creating Supabase client...')
      const supabase = await createClient(); // Only call createClient, it handles cookies internally
      
      console.log('Verifying OTP...')
      const { data, error } = await supabase.auth.verifyOtp({
        type: type as any,
        token_hash,
      })
      
      console.log('VerifyOtp result:', { 
        success: !error,
        hasUser: !!data?.user,
        error: error?.message 
      })
      
      if (!error) {
        if (type === 'recovery') {
          console.log('Redirecting to /reset-password')
          return NextResponse.redirect(new URL('/reset-password', request.url))
        }
        console.log('Redirecting to:', next)
        return NextResponse.redirect(new URL(next, request.url))
      } else {
        console.error('OTP verification failed:', error)
      }
    } else {
      console.log('Missing token_hash or type')
    }

    console.log('Redirecting to error page')
    return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
    
  } catch (err) {
    console.error('=== CALLBACK ERROR ===', err)
    return NextResponse.redirect(new URL('/auth/auth-code-error', request.url))
  }
}
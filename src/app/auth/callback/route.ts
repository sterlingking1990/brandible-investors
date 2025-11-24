import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  console.log('Auth callback - params:', { code: !!code })

  // If we have a code, try the modern flow
  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            // Handle cookie setting
          },
          remove(name: string, options: CookieOptions) {
            // Handle cookie removal
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      console.log('✓ Code exchange successful')
      return NextResponse.redirect(`${origin}/reset-password?verified=true`)
    }
    console.error('Code exchange failed:', error)
  }

  // No code means Supabase is using hash fragments
  // Return a page that will handle the hash client-side
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Processing Reset Link...</title>
      <style>
        body { font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f9fafb; }
        .spinner { border: 2px solid #e5e7eb; border-top: 2px solid #3b82f6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
    </head>
    <body>
      <div style="text-align: center;">
        <div class="spinner"></div>
        <p style="margin-top: 16px; color: #6b7280;">Processing reset link...</p>
      </div>
      <script>
        // Check for tokens in hash
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');
        
        console.log('Hash params:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type });
        
        if (type === 'recovery' && accessToken) {
          // Redirect to reset password with tokens
          const resetUrl = new URL('/reset-password', window.location.origin);
          resetUrl.searchParams.set('access_token', accessToken);
          if (refreshToken) resetUrl.searchParams.set('refresh_token', refreshToken);
          resetUrl.searchParams.set('type', 'recovery');
          window.location.replace(resetUrl.toString());
        } else {
          // No valid tokens, redirect to login
          window.location.replace('/login?message=Invalid or expired reset link. Please try again.');
        }
      </script>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' },
  })
}

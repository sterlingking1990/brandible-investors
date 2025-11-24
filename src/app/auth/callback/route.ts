import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  let response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  console.log('Auth callback - params:', { code: !!code })

  // Handle code exchange (modern flow)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      console.log('✓ Code exchange successful')
      return NextResponse.redirect(`${origin}/?password_setup=true`)
    }
    console.error('Code exchange failed:', error)
  }

  // No code - return HTML page to handle hash fragments
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
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');
        
        if (type === 'recovery' && accessToken) {
          // Create a form to POST the tokens to establish session
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = '/auth/callback';
          
          const tokenInput = document.createElement('input');
          tokenInput.type = 'hidden';
          tokenInput.name = 'access_token';
          tokenInput.value = accessToken;
          form.appendChild(tokenInput);
          
          if (refreshToken) {
            const refreshInput = document.createElement('input');
            refreshInput.type = 'hidden';
            refreshInput.name = 'refresh_token';
            refreshInput.value = refreshToken;
            form.appendChild(refreshInput);
          }
          
          document.body.appendChild(form);
          form.submit();
        } else {
          window.location.replace('/login?message=Invalid or expired reset link. Please try again.');
        }
      </script>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' },
  })
}

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const accessToken = formData.get('access_token') as string
  const refreshToken = formData.get('refresh_token') as string

  if (!accessToken) {
    return NextResponse.redirect(`${request.nextUrl.origin}/login?message=Invalid reset link`)
  }

  let response = NextResponse.redirect(`${request.nextUrl.origin}/?password_setup=true`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  try {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || ''
    })

    if (error) {
      console.error('Session setup failed:', error)
      return NextResponse.redirect(`${request.nextUrl.origin}/login?message=Failed to establish session`)
    }

    console.log('✓ Session established successfully')
    return response

  } catch (err) {
    console.error('Session error:', err)
    return NextResponse.redirect(`${request.nextUrl.origin}/login?message=Authentication failed`)
  }
}

// middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const authPaths = ['/login']
const publicPaths = [
  '/reset-password', 
  '/auth/callback', 
  '/forgot-password', 
  '/auth/auth-code-error'
]

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { pathname, searchParams, hash } = request.nextUrl

  // Check if the current path is public
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  const isAuthPath = authPaths.some(path => pathname.startsWith(path))

  // Special case: allow reset-password with ANY parameters or hash (for password reset flow)
  const isResetPasswordPage = pathname === '/reset-password'
  
  // Special case: check if this is coming from Supabase verification with hash parameters
  const hasHashParams = hash.includes('access_token') || hash.includes('type=recovery')

  // Allow public paths, reset-password page, and reset-password with hash params
  if (isPublicPath) {
    return response
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If user is not logged in and tries to access a protected route, redirect to login
  if (!session && !isAuthPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If user is logged in and tries to access an auth page, redirect to home
  if (session && isAuthPath) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|mp4|webm|ogg|wav|mp3|mov|flv|wmv|avi|ttf|woff|woff2|eot|json)).*)',
  ],
}
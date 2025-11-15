import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'

import type { NextRequest } from 'next/server'

const authPaths = ['/login']
const publicPaths = ['/reset-password', '/auth/callback', '/forgot-password']

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

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  // If user is not logged in and tries to access a protected route, redirect to login
  if (!session && !publicPaths.includes(pathname) && !authPaths.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If user is logged in and tries to access an auth page, redirect to home
  if (session && authPaths.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - all other public files in the public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:png|jpg|jpeg|gif|webp|svg|ico|mp4|webm|ogg|wav|mp3|mov|flv|wmv|avi|ttf|woff|woff2|eot|json)).*)',
  ],
}


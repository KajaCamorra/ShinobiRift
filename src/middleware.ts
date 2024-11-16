// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const sessionToken = request.cookies.get('playfab_session')?.value

  // Skip middleware for static files and auth endpoints
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api/auth') ||
    path.includes('.')
  ) {
    return NextResponse.next()
  }

  // Protected routes check
  if (!sessionToken && path.startsWith('/game')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/game/:path*']
}
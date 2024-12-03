import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const DEBUG = true;

export function middleware(request: NextRequest) {
  console.log('\n[Middleware] ==================== START ====================');
  console.log(`[Middleware] Request URL: ${request.url}`);
  console.log(`[Middleware] Request method: ${request.method}`);
  console.log(`[Middleware] Pathname: ${request.nextUrl.pathname}`);

  // Check if this is a game route
  if (request.nextUrl.pathname.startsWith('/game')) {
    console.log('[Middleware] Processing game route request');
    
    // Check for session cookie
    const sessionCookie = request.cookies.get('session_token');
    
    if (DEBUG) {
      console.log('[Middleware] Cookies:', {
        all: request.cookies.getAll(),
        session: sessionCookie,
      });
    }
    
    // If we have a session cookie, allow the request
    if (sessionCookie?.value) {
      console.log('[Middleware] Valid session cookie found allowing request');
      console.log('[Middleware] ==================== END ====================\n');
      return NextResponse.next();
    }

    // If we get here, we don't have a valid session
    console.log('[Middleware] No valid session found redirecting to login');
    console.log('[Middleware] ==================== END ====================\n');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // For login page, check if user is already authenticated
  if (request.nextUrl.pathname === '/login') {
    console.log('[Middleware] Processing login route request');
    
    const sessionCookie = request.cookies.get('session_token');
    if (sessionCookie?.value) {
      console.log('[Middleware] User already authenticated, redirecting to game');
      console.log('[Middleware] ==================== END ====================\n');
      return NextResponse.redirect(new URL('/game', request.url));
    }
  }

  console.log('[Middleware] Non-game route allowing request');
  console.log('[Middleware] ==================== END ====================\n');
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (public assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|assets).*)',
  ],
};

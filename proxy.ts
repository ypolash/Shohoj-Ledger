import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/session';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next();

  // Protect /dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const session = await getSession();

    if (!session) {
      // Not logged in, redirect to login
      response = NextResponse.redirect(new URL('/login', request.url));
    } else if (session.user.role === 'EMPLOYEE') {
      // Employees should use the mobile app or staff interface.
      // Redirect them if they try to access the admin dashboard.
      response = NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
    }
  }

  // 1. Enforce Security Headers (Enterprise Hardening)
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  
  // Basic rate limiting placeholder for Edge environments
  // Real implementation requires Redis (Upstash) or similar Edge-compatible store
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  response.headers.set('X-RateLimit-Limit', '100');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

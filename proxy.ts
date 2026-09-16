import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/session';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Read session directly from NextRequest
  let token = request.cookies.get('session')?.value;
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.slice(7).trim();
    }
  }

  let session: any = null;
  if (token) {
    try {
      session = await decrypt(token);
    } catch (e) {
      session = null;
    }
  }

  // Protect /dashboard and /erp routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/erp')) {
    if (!session || !session.user) {
      return NextResponse.redirect(new URL('/login', request.url));
    } else if (session.user.role === 'EMPLOYEE') {
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
    }
  }

  // Protect /super-admin routes (allow /super-admin/login freely)
  if (pathname.startsWith('/super-admin') && pathname !== '/super-admin/login') {
    if (!session || !session.user) {
      return NextResponse.redirect(new URL('/super-admin/login', request.url));
    } else if (session.user.platformRole !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/super-admin/login?error=forbidden', request.url));
    }
  }

  const response = NextResponse.next();

  // Enforce Security Headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|downloads).*)',
  ],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const session = await getSession();

    if (!session) {
      // Not logged in, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (session.user.role === 'EMPLOYEE') {
      // Employees should use the mobile app or staff interface.
      // Redirect them if they try to access the admin dashboard.
      // Assuming /staff or something exists, or just deny access.
      // Let's redirect to a dedicated staff page or login for now.
      return NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
    }

    // Role is ADMIN, allow access
    return NextResponse.next();
  }

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
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

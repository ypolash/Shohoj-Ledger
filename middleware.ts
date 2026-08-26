import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET;
const key = new TextEncoder().encode(secretKey || "development_secret_only");

export async function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value;
  
  if (!sessionToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  try {
    const { payload } = await jwtVerify(sessionToken, key, {
      algorithms: ['HS256'],
    });
    
    // Check super-admin access
    if (request.nextUrl.pathname.startsWith('/super-admin')) {
      const user = payload.user as any;
      if (user?.platformRole !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/erp', request.url));
      }
    }
    
    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/erp/:path*', 
    '/super-admin/:path*',
    '/dashboard/:path*'
  ],
}

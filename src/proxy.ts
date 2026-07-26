import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-key-bruang-app-2026'
);

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Public paths that don't require authentication
  const isPublicPath = path === '/login' || path.startsWith('/api/auth') || path.startsWith('/_next') || path === '/favicon.ico';
  
  const token = request.cookies.get('session')?.value;

  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token) {
    try {
      const { payload } = await jwtVerify(token, SECRET_KEY, {
        algorithms: ['HS256'],
      });

      // If user is logged in but tries to access login page, redirect to home
      if (path === '/login') {
        return NextResponse.redirect(new URL('/', request.url));
      }

      // If user is pending, they can only access /pending and api routes
      if (payload.status === 'pending' && path !== '/pending' && !path.startsWith('/api')) {
        return NextResponse.redirect(new URL('/pending', request.url));
      }

      // If user is active but tries to access /pending, redirect to home
      if (payload.status === 'active' && path === '/pending') {
        return NextResponse.redirect(new URL('/', request.url));
      }

    } catch (error) {
      // Invalid token
      if (!isPublicPath) {
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('session');
        return response;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

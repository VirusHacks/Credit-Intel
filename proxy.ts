import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const publicRoutes = ['/login', '/api/auth/login'];
const adminRoutes = ['/admin', '/audit', '/settings'];
const analystRoutes = ['/applications', '/analysis', '/documents'];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Get token from cookie or Authorization header
  const token = request.cookies.get('auth-token')?.value ||
    request.headers.get('authorization')?.split(' ')[1];

  if (!token) {
    // Redirect to login if accessing protected route without token
    if (!pathname.startsWith('/api')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Verify token
  const payload = verifyToken(token);
  if (!payload) {
    if (!pathname.startsWith('/api')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Check role-based access
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (payload.role !== 'admin') {
      return NextResponse.json(
        { message: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }
  }

  if (analystRoutes.some((route) => pathname.startsWith(route))) {
    if (!['admin', 'analyst'].includes(payload.role)) {
      return NextResponse.json(
        { message: 'Forbidden: Analyst access required' },
        { status: 403 }
      );
    }
  }

  // Add user info to request headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-role', payload.role);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

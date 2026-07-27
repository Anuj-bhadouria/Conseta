import { NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

export const runtime = 'nodejs';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // allow auth pages, auth API, and the public widget script through untouched
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/consent-log') ||
    pathname === '/widget.js'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value;
  const payload = token ? verifyToken(token) : null;

  if (!payload) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};

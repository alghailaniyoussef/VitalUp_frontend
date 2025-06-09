import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['en', 'es'];
const defaultLocale = 'es';

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/settings',
  '/quiz',
  '/challenges',
  '/badges',
  '/admin'
];

// Get the preferred locale, similar to the above or using a library
function getLocale(request: NextRequest): string {
  // Check if there is any supported locale in the pathname
  const { pathname } = request.nextUrl;
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    // Extract and return the locale from the pathname
    const locale = pathname.split('/')[1];
    return locales.includes(locale) ? locale : defaultLocale;
  }

  // If no locale in pathname, return default locale
  return defaultLocale;
}

function isProtectedRoute(pathname: string): boolean {
  // Remove locale from pathname to check against protected routes
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '') || '/';
  return protectedRoutes.some(route => 
    pathWithoutLocale.startsWith(route) || pathWithoutLocale === route
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/logo.png') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check if there is any supported locale in the pathname
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Redirect if there is no locale
  if (!pathnameHasLocale) {
    const locale = getLocale(request);
    const newUrl = new URL(`/${locale}${pathname}`, request.url);
    return NextResponse.redirect(newUrl);
  }

  // Check authentication for protected routes
  if (isProtectedRoute(pathname)) {
    // Check for token in cookies (auth_token) or Authorization header
    const token = request.cookies.get('auth_token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      const locale = pathname.split('/')[1] || defaultLocale;
      const loginUrl = new URL(`/${locale}/auth/signin`, request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next|api|favicon.ico|logo.png).*)',
    // Optional: only run on root (/) URL
    // '/'
  ],
};
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Routes that don't require authentication
const publicRoutes = ['/login'];

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/profile', '/admin', '/settings'];

const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales: ['pt', 'en', 'es'],

  // Used when no locale matches
  defaultLocale: 'pt',

  // Always redirect to locale
  localePrefix: 'always'
});

// Helper function to validate token with Supabase
async function validateSupabaseToken(token: string): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return false;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    return !error && !!user;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  // Extract locale from pathname
  const locale = pathname.split('/')[1];
  const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';

  // Check if route is public or protected
  const isPublicRoute = publicRoutes.some(route => pathWithoutLocale.startsWith(route));
  const isProtectedRoute = protectedRoutes.some(route => pathWithoutLocale.startsWith(route));

  try {
    // Get session from cookies using simple cookie parsing
    const getCookie = (name: string): string | null => {
      const cookies = request.headers.get('cookie') || '';
      const value = `; ${cookies}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null;
      }
      return null;
    };

    const accessToken = getCookie(process.env.NEXT_PUBLIC_COOKIE_TOKEN || 'zion-session');
    const refreshToken = getCookie(process.env.NEXT_PUBLIC_COOKIE_REFRESH || 'zion-refresh');

    // Enhanced session validation
    let hasValidSession = false;

    if (accessToken) {
      // Validate access token with Supabase
      hasValidSession = await validateSupabaseToken(accessToken);
    } else if (refreshToken) {
      // If no access token but refresh token exists, consider session potentially valid
      // The client-side will handle token refresh
      hasValidSession = true;
    }

    // If user is on a public route and has a valid session, redirect to dashboard
    if (isPublicRoute && hasValidSession && pathWithoutLocale.includes('/login')) {
      return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
    }

    // If user is on a protected route without a valid session, redirect to login
    if (isProtectedRoute && !hasValidSession) {
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set('redirect', pathWithoutLocale);
      return NextResponse.redirect(loginUrl);
    }

    // Apply internationalization middleware
    return intlMiddleware(request);

  } catch (error) {
    console.error('Middleware error:', error);

    // If there's an error and user is trying to access protected route, redirect to login
    if (isProtectedRoute) {
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set('redirect', pathWithoutLocale);
      return NextResponse.redirect(loginUrl);
    }

    // Apply internationalization middleware as fallback
    return intlMiddleware(request);
  }
}

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(pt|en|es)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};
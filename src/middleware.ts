import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Exclude webhook routes from authentication checks
  if (request.nextUrl.pathname.startsWith('/api/webhook')) {
    console.log('Middleware: Skipping auth check for webhook');
    return NextResponse.next();
  }

  // updateSession checks if the user is authenticated and redirects
  // to /auth/login if not, for the paths defined in the matcher below.
  console.log('Middleware: Running updateSession for path:', request.nextUrl.pathname);
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match only routes that should be protected.
     * Add any additional routes that require authentication here.
     */
    '/protected/:path*', // Protect the example protected route
    // Add other routes here, e.g.:
    // '/dashboard/:path*',
    // '/account/:path*',
  ],
}

import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // updateSession checks if the user is authenticated and redirects
  // to /auth/login if not, for the paths defined in the matcher below.
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

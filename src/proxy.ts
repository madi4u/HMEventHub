import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const protectedRoutes = ['/dashboard', '/admin', '/superadmin', '/events', '/my-events', '/time-tracking', '/inventory', '/cash-reports', '/checklists', '/feed', '/onboarding', '/products', '/logistics', '/users', '/settings']
const publicRoutes = ['/login', '/reset-password']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes and API auth routes
  if (
    publicRoutes.some((route) => pathname.startsWith(route)) ||
    pathname.startsWith('/api/auth') ||
    pathname === '/'
  ) {
    return NextResponse.next()
  }

  const { supabaseResponse, user } = await updateSession(request)

  // Check if route needs protection
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

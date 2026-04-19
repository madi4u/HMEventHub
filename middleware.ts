import { NextRequest, NextResponse } from "next/server"

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL ?? "https://auth.hundm.cloud"
const SESSION_COOKIE = "hundm_session"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip static assets and API routes that don't need auth
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/api/health"
  ) {
    return NextResponse.next()
  }

  // Public routes: login redirect handler
  if (pathname.startsWith("/auth/") || pathname.startsWith("/login")) {
    return NextResponse.next()
  }

  const cookieHeader = req.headers.get("cookie") ?? ""
  const sessionToken = req.cookies.get(SESSION_COOKIE)?.value

  if (!sessionToken) {
    const authUrl = new URL(`${AUTH_SERVICE_URL}/login`)
    authUrl.searchParams.set("callback", req.url)
    return NextResponse.redirect(authUrl)
  }

  // Validate session with auth service
  let session: {
    userId: string
    email: string
    name: string
    isSuperadmin: boolean
    activeOrgId: string | null
    activeOrgName: string | null
  } | null = null

  try {
    const res = await fetch(`${AUTH_SERVICE_URL}/api/session`, {
      headers: { Cookie: cookieHeader },
      next: { revalidate: 60 }, // cache for 60s
    })
    if (res.ok) {
      session = await res.json()
    }
  } catch {
    // Auth service down — redirect to login
    const authUrl = new URL(`${AUTH_SERVICE_URL}/login`)
    authUrl.searchParams.set("callback", req.url)
    return NextResponse.redirect(authUrl)
  }

  if (!session) {
    const authUrl = new URL(`${AUTH_SERVICE_URL}/login`)
    authUrl.searchParams.set("callback", req.url)
    return NextResponse.redirect(authUrl)
  }

  if (!session.activeOrgId) {
    return NextResponse.redirect(`${AUTH_SERVICE_URL}/select-org?callback=${encodeURIComponent(req.url)}`)
  }

  // Check app access
  let appRole = "viewer"
  try {
    const res = await fetch(`${AUTH_SERVICE_URL}/api/access/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: session.userId,
        orgId: session.activeOrgId,
        appId: "eventhub",
      }),
      next: { revalidate: 60 },
    })
    if (res.ok) {
      const access = await res.json()
      if (!access.allowed) {
        return NextResponse.redirect(`${AUTH_SERVICE_URL}/no-access`)
      }
      appRole = access.appRole ?? "viewer"
    }
  } catch {
    // Access check failed — allow through (fail open for now)
  }

  const response = NextResponse.next()
  response.headers.set("X-User-Id", session.userId)
  response.headers.set("X-User-Email", session.email)
  response.headers.set("X-User-Name", session.name)
  response.headers.set("X-Org-Id", session.activeOrgId)
  response.headers.set("X-Org-Name", session.activeOrgName ?? "")
  response.headers.set("X-App-Role", appRole)
  response.headers.set("X-Is-Superadmin", session.isSuperadmin ? "true" : "false")
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

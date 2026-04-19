/**
 * Client-side Supabase shim.
 * Client components that still reference createClient() get a stub
 * that redirects auth calls to the auth service.
 */

export function createClient() {
  const authUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL ?? "https://auth.hundm.cloud"

  return {
    auth: {
      async getUser() {
        // Client-side session check via API
        const res = await fetch("/api/auth/me")
        if (!res.ok) return { data: { user: null }, error: new Error("Not authenticated") }
        const user = await res.json()
        return { data: { user }, error: null }
      },
      async signOut() {
        await fetch("/api/auth/logout", { method: "POST" })
        window.location.href = `${authUrl}/login`
        return { error: null }
      },
      async signInWithPassword(_: unknown) {
        window.location.href = `${authUrl}/login`
        return { data: { user: null }, error: new Error("Use magic link login") }
      },
    },
    from(_table: string) {
      // Client-side DB calls should go through API routes, not direct DB
      return {
        select: () => ({ data: null, error: new Error("Use API routes for client-side data") }),
        insert: () => ({ data: null, error: new Error("Use server actions") }),
        update: () => ({ data: null, error: new Error("Use server actions") }),
        delete: () => ({ data: null, error: new Error("Use server actions") }),
        eq: () => ({ data: null, error: null, single: () => ({ data: null, error: null }) }),
      }
    },
  }
}

/**
 * Migration shim: replaces @supabase/ssr createClient() calls.
 * Returns an object with the same interface as Supabase client
 * but backed by direct PostgreSQL via db.ts + hundm-auth sessions.
 */

import { db } from "@/lib/db"
import { getSessionFromHeaders } from "@/lib/session"

export async function createClient() {
  return {
    // Auth compatibility shim
    auth: {
      async getUser() {
        const session = await getSessionFromHeaders()
        if (!session) return { data: { user: null }, error: new Error("Not authenticated") }
        return {
          data: {
            user: {
              id: session.userId,
              email: session.email,
              user_metadata: { full_name: session.name },
            },
          },
          error: null,
        }
      },
    },

    // DB query shim — mirrors supabase.from() API
    from(table: string) {
      return db.from(table)
    },

    // Storage shim (stub — migrate to files service later)
    storage: {
      from(_bucket: string) {
        return {
          upload: async (_path: string, _file: unknown) => ({ data: null, error: new Error("Use files service") }),
          getPublicUrl: (_path: string) => ({ data: { publicUrl: "" } }),
          remove: async (_paths: string[]) => ({ data: null, error: null }),
        }
      },
    },
  }
}

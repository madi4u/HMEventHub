import { NextResponse, type NextRequest } from 'next/server'

// Stub — replaced by root middleware.ts hundm-auth integration
export async function updateSession(request: NextRequest) {
  return { supabaseResponse: NextResponse.next({ request }), user: null }
}

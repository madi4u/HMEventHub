import { NextResponse } from "next/server"
import { getSessionFromHeaders } from "@/lib/session"

export async function GET() {
  const session = await getSessionFromHeaders()
  if (!session) return NextResponse.json(null, { status: 401 })
  return NextResponse.json({
    id: session.userId,
    email: session.email,
    user_metadata: { full_name: session.name },
  })
}

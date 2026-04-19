import { NextResponse } from "next/server"

export async function POST() {
  const authUrl = process.env.AUTH_SERVICE_URL ?? "https://auth.hundm.cloud"
  // Proxy to auth service logout
  await fetch(`${authUrl}/api/auth/logout`, { method: "POST" }).catch(() => {})
  return NextResponse.json({ success: true })
}

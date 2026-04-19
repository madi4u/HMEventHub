import { NextRequest, NextResponse } from 'next/server'

// Auth is now handled by auth.hundm.cloud
// This route is kept for backward compatibility but just redirects to dashboard
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const next = searchParams.get('next') ?? '/dashboard'
  return NextResponse.redirect(`${origin}${next}`)
}

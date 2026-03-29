import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdminRole } from '@/lib/utils'
import type { UserRole } from '@/types'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2),
  role: z.enum(['TENANT_ADMIN', 'OWNER', 'EVENT_MANAGER', 'STANDLEITER', 'EMPLOYEE', 'READ_ONLY']),
  preferred_language: z.enum(['de', 'en', 'es']).default('de'),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile || !isAdminRole(profile.role as UserRole)) {
    return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingabe', details: parsed.error.flatten() }, { status: 400 })
  }

  const { email, full_name, role, preferred_language } = parsed.data

  const admin = createAdminClient()

  // Invite user via Supabase Auth
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://hm-eventhub.vercel.app'}/auth/callback?next=/update-password`,
    data: { full_name },
  })

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 400 })
  }

  // Upsert profile — trigger may not have fired yet so update could miss
  const { error: profileError } = await admin
    .from('profiles')
    .upsert({
      user_id: invited.user.id,
      email,
      full_name,
      role,
      preferred_language,
      tenant_id: profile.tenant_id,
      is_active: true,
    }, { onConflict: 'user_id' })

  if (profileError) {
    return NextResponse.json({ error: 'Benutzer eingeladen, aber Profil konnte nicht aktualisiert werden: ' + profileError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
  admin_name: z.string().min(2),
  admin_email: z.string().email(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  if (!profile || profile.role !== 'TENANT_ADMIN') return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 403 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })

  const { name, slug, status, admin_name, admin_email } = parsed.data
  const admin = createAdminClient()

  // Create tenant
  const { data: tenant, error: tenantError } = await admin
    .from('tenants')
    .insert({ name, slug, status })
    .select()
    .single()

  if (tenantError) return NextResponse.json({ error: tenantError.message }, { status: 400 })

  // Invite admin user
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(admin_email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://hm-eventhub.vercel.app'}/update-password`,
    data: { full_name: admin_name },
  })

  if (inviteError) {
    await admin.from('tenants').delete().eq('id', tenant.id)
    return NextResponse.json({ error: 'Mandant erstellt, aber Einladung fehlgeschlagen: ' + inviteError.message }, { status: 400 })
  }

  // Set profile role + tenant
  await admin.from('profiles').update({
    full_name: admin_name,
    role: 'TENANT_ADMIN',
    tenant_id: tenant.id,
    is_active: true,
  }).eq('user_id', invited.user.id)

  return NextResponse.json({ success: true, tenant })
}

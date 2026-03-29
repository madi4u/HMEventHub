import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
}).refine((d) => d.email || d.password, { message: 'E-Mail oder Passwort erforderlich' })

// Roles that admins are allowed to manage credentials for
const MANAGEABLE_ROLES = ['EVENT_MANAGER', 'STANDLEITER', 'EMPLOYEE', 'READ_ONLY']
const ADMIN_ROLES = ['TENANT_ADMIN', 'OWNER']

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params // profile id of target user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

  const { data: callerProfile } = await supabase.from('profiles').select('role, tenant_id').eq('user_id', user.id).single()
  if (!callerProfile || !ADMIN_ROLES.includes(callerProfile.role)) {
    return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 403 })
  }

  const admin = createAdminClient()

  // Verify target user belongs to same tenant and has a manageable role
  const { data: targetProfile } = await admin.from('profiles').select('user_id, role, tenant_id').eq('id', id).single()
  if (!targetProfile) return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
  if (targetProfile.tenant_id !== callerProfile.tenant_id) return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 403 })
  if (!MANAGEABLE_ROLES.includes(targetProfile.role)) {
    return NextResponse.json({ error: 'Zugangsdaten dieses Benutzers können nicht geändert werden' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })

  const updates: { email?: string; password?: string } = {}
  if (parsed.data.email) updates.email = parsed.data.email
  if (parsed.data.password) updates.password = parsed.data.password

  const { error } = await admin.auth.admin.updateUserById(targetProfile.user_id, updates)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Keep profile email in sync if email changed
  if (parsed.data.email) {
    await admin.from('profiles').update({ email: parsed.data.email }).eq('id', id)
  }

  return NextResponse.json({ success: true })
}

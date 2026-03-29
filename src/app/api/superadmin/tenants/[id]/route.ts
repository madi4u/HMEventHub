import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  if (!profile || profile.role !== 'TENANT_ADMIN') return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 403 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('tenants').update(parsed.data).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  if (!profile || profile.role !== 'TENANT_ADMIN') return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 403 })

  const admin = createAdminClient()

  // Delete all auth users belonging to this tenant first
  const { data: tenantProfiles } = await admin.from('profiles').select('user_id').eq('tenant_id', id)
  if (tenantProfiles && tenantProfiles.length > 0) {
    await Promise.all(tenantProfiles.map((p) => admin.auth.admin.deleteUser(p.user_id)))
  }

  // Delete tenant (cascades to profiles, events, etc. via DB)
  const { error } = await admin.from('tenants').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ success: true })
}

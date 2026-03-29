import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  if (!profile || profile.role !== 'TENANT_ADMIN') return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin.from('profiles').select('*').eq('tenant_id', id).order('full_name')
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json(data)
}

const updateSchema = z.object({
  profileId: z.string().uuid(),
  role: z.enum(['TENANT_ADMIN', 'OWNER', 'EVENT_MANAGER', 'STANDLEITER', 'EMPLOYEE', 'READ_ONLY']),
  is_active: z.boolean(),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  if (!profile || profile.role !== 'TENANT_ADMIN') return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 403 })

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Eingabe' }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from('profiles')
    .update({ role: parsed.data.role, is_active: parsed.data.is_active })
    .eq('id', parsed.data.profileId)
    .eq('tenant_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isManagerRole } from '@/lib/utils'
import type { UserRole } from '@/types'
import { ChecklistSettingsClient } from './checklists-settings-client'

export default async function ChecklistSettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (!isManagerRole(profile.role as UserRole)) redirect('/settings')

  const { data: templates } = await supabase
    .from('checklist_templates')
    .select('*, items:checklist_template_items(*)')
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: false })

  return (
    <ChecklistSettingsClient
      templates={templates ?? []}
      tenantId={profile.tenant_id}
    />
  )
}

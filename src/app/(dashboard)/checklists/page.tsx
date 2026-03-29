import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChecklistsClient } from './checklists-client'
import { isManagerRole } from '@/lib/utils'
import type { ChecklistTemplate, UserRole } from '@/types'

export default async function ChecklistsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/login')

  const isManager = isManagerRole(profile.role as UserRole)

  const { data: templates } = await supabase
    .from('checklist_templates')
    .select('*, items:checklist_template_items(id)')
    .eq('tenant_id', profile.tenant_id)
    .order('name', { ascending: true })

  return (
    <ChecklistsClient
      templates={(templates ?? []) as (ChecklistTemplate & { items: { id: string }[] })[]}
      isManager={isManager}
    />
  )
}

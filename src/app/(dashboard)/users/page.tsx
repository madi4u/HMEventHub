import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UsersClient } from './users-client'
import { isAdminRole } from '@/lib/utils'
import type { Profile, UserRole } from '@/types'

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (!isAdminRole(profile.role as UserRole)) redirect('/my-events')

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .order('full_name', { ascending: true })

  return <UsersClient users={(users ?? []) as Profile[]} />
}

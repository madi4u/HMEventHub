import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EventsClient } from './events-client'
import { isManagerRole } from '@/lib/utils'
import type { UserRole } from '@/types'

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; q?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (!isManagerRole(profile.role as UserRole)) redirect('/my-events')

  let query = supabase
    .from('events')
    .select('*, assignments:event_assignments(count)')
    .eq('tenant_id', profile.tenant_id)
    .order('start_date', { ascending: false })

  if (params.status) query = query.eq('status', params.status)
  if (params.type) query = query.eq('event_type', params.type)
  if (params.q) query = query.ilike('title', `%${params.q}%`)

  const { data: events } = await query

  return (
    <EventsClient
      events={(events ?? []).map((e) => ({
        id: e.id,
        title: e.title,
        event_type: e.event_type,
        start_date: e.start_date,
        end_date: e.end_date,
        status: e.status,
        city: e.city,
        teamCount: (e.assignments as { count: number }[])?.[0]?.count ?? 0,
      }))}
    />
  )
}

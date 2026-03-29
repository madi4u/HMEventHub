import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TimeTrackingClient } from './time-tracking-client'

export default async function TimeTrackingPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: assignments } = await supabase
    .from('event_assignments')
    .select('event_id, events(id, title, status)')
    .eq('user_id', profile.id)

  const assignedEvents = assignments
    ?.filter((a) => {
      const ev = a.events as unknown as { status: string } | null
      return ev && ['CONFIRMED', 'ACTIVE'].includes(ev.status)
    })
    .map((a) => {
      const ev = a.events as unknown as { id: string; title: string } | null
      return { id: a.event_id, title: ev?.title ?? '' }
    }) ?? []

  const { data: history } = await supabase
    .from('time_entries')
    .select('*, events(title)')
    .eq('user_id', profile.id)
    .order('clock_in', { ascending: false })
    .limit(20)

  return (
    <TimeTrackingClient
      profileId={profile.id}
      assignedEvents={assignedEvents}
      history={(history ?? []).map((e) => ({
        id: e.id,
        clock_in: e.clock_in,
        clock_out: e.clock_out,
        break_minutes: e.break_minutes,
        status: e.status,
        events: (e.events as { title: string } | null),
      }))}
    />
  )
}

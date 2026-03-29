import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MyEventsClient } from './my-events-client'

export default async function MyEventsPage() {
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
    .select('event_id')
    .eq('user_id', profile.id)

  const eventIds = assignments?.map((a) => a.event_id) ?? []
  const today = new Date().toISOString().split('T')[0]

  let events: Array<{
    id: string
    title: string
    event_type: string
    start_date: string
    end_date: string
    status: string
    city: string | null
    start_time: string | null
  }> = []

  if (eventIds.length > 0) {
    const { data } = await supabase
      .from('events')
      .select('id, title, event_type, start_date, end_date, status, city, start_time')
      .in('id', eventIds)
      .order('start_date', { ascending: true })
    events = data ?? []
  }

  const upcomingEvents = events.filter((e) => e.start_date >= today)
  const pastEvents = events.filter((e) => e.end_date < today)

  return <MyEventsClient upcomingEvents={upcomingEvents} pastEvents={pastEvents} />
}

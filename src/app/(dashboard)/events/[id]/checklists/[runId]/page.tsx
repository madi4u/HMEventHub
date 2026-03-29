import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChecklistRunClient } from './checklist-run-client'

export default async function ChecklistRunPage({
  params,
}: {
  params: Promise<{ id: string; runId: string }>
}) {
  const { id: eventId, runId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, tenant_id, role, preferred_language')
    .eq('user_id', user.id)
    .single()
  if (!profile) redirect('/login')

  const { data: run } = await supabase
    .from('event_checklist_runs')
    .select('*, template:checklist_templates(*, items:checklist_template_items(*))')
    .eq('id', runId)
    .eq('event_id', eventId)
    .single()

  if (!run) notFound()

  const { data: answers } = await supabase
    .from('event_checklist_answers')
    .select('*')
    .eq('run_id', runId)

  const { data: event } = await supabase
    .from('events')
    .select('title')
    .eq('id', eventId)
    .single()

  return (
    <ChecklistRunClient
      run={run}
      answers={answers ?? []}
      eventId={eventId}
      eventTitle={event?.title ?? ''}
      profileId={profile.id}
      language={profile.preferred_language ?? 'de'}
    />
  )
}

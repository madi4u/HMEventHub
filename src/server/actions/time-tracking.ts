'use server'

import { createClient } from '@/lib/supabase/server'

async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Nicht authentifiziert')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profil nicht gefunden')
  return { supabase, profile }
}

export async function clockIn(
  eventId: string,
  location?: { lat: number; lng: number }
) {
  const { supabase, profile } = await getProfile()

  // Check no existing active entry
  const { data: existing } = await supabase
    .from('time_entries')
    .select('id')
    .eq('user_id', profile.id)
    .eq('status', 'ACTIVE')
    .single()

  if (existing) throw new Error('Bereits eingestempelt')

  const { data, error } = await supabase
    .from('time_entries')
    .insert({
      user_id: profile.id,
      event_id: eventId,
      tenant_id: profile.tenant_id,
      clock_in: new Date().toISOString(),
      status: 'ACTIVE',
      location_in: location ?? null,
      break_minutes: 0,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function clockOut(
  entryId: string,
  location?: { lat: number; lng: number }
) {
  const { supabase, profile } = await getProfile()

  const { data, error } = await supabase
    .from('time_entries')
    .update({
      clock_out: new Date().toISOString(),
      status: 'COMPLETED',
      location_out: location ?? null,
    })
    .eq('id', entryId)
    .eq('user_id', profile.id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function startBreak(entryId: string) {
  const { supabase, profile } = await getProfile()
  // We track breaks by storing break_start in metadata - for simplicity we mark with a flag
  // In production this would use a separate breaks table
  return { entryId, breakStart: new Date().toISOString() }
}

export async function endBreak(entryId: string, breakStartTime: string) {
  const { supabase, profile } = await getProfile()

  const { data: entry } = await supabase
    .from('time_entries')
    .select('break_minutes')
    .eq('id', entryId)
    .eq('user_id', profile.id)
    .single()

  if (!entry) throw new Error('Eintrag nicht gefunden')

  const additionalBreakMinutes = Math.floor(
    (Date.now() - new Date(breakStartTime).getTime()) / 1000 / 60
  )

  const { data, error } = await supabase
    .from('time_entries')
    .update({
      break_minutes: (entry.break_minutes ?? 0) + additionalBreakMinutes,
    })
    .eq('id', entryId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function getTimeEntriesForEvent(eventId: string) {
  const { supabase, profile } = await getProfile()

  const { data, error } = await supabase
    .from('time_entries')
    .select('*, profile:profiles(full_name, email)')
    .eq('event_id', eventId)
    .eq('tenant_id', profile.tenant_id)
    .order('clock_in', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function getMyTimeEntries() {
  const { supabase, profile } = await getProfile()

  const { data, error } = await supabase
    .from('time_entries')
    .select('*, events(title)')
    .eq('user_id', profile.id)
    .order('clock_in', { ascending: false })
    .limit(50)

  if (error) throw new Error(error.message)
  return data
}

export async function approveTimeEntry(entryId: string) {
  const { supabase } = await getProfile()

  const { data, error } = await supabase
    .from('time_entries')
    .update({ status: 'APPROVED' })
    .eq('id', entryId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

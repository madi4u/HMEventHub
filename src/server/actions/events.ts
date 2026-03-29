'use server'

import { createClient } from '@/lib/supabase/server'
import { generateDateRange, isManagerRole } from '@/lib/utils'
import type { CreateEventInput, UserRole } from '@/types'

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

export async function createEvent(data: CreateEventInput) {
  const { supabase, profile } = await getProfile()

  if (!isManagerRole(profile.role as UserRole)) {
    throw new Error('Nicht berechtigt')
  }

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      ...data,
      tenant_id: profile.tenant_id,
      created_by: profile.id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Create event days
  const dates = generateDateRange(data.start_date, data.end_date)
  const eventDays = dates.map((date, index) => ({
    tenant_id: profile.tenant_id,
    event_id: event.id,
    event_date: date,
    day_label: `Tag ${index + 1}`,
    status: 'OPEN' as const,
  }))

  await supabase.from('event_days').insert(eventDays)

  // Log activity
  await supabase.from('activity_logs').insert({
    tenant_id: profile.tenant_id,
    user_id: profile.id,
    action: `Veranstaltung erstellt: ${data.title}`,
    resource_type: 'EVENT',
    resource_id: event.id,
  })

  return event
}

export async function updateEvent(id: string, data: Partial<CreateEventInput>) {
  const { supabase, profile } = await getProfile()

  if (!isManagerRole(profile.role as UserRole)) {
    throw new Error('Nicht berechtigt')
  }

  const { data: event, error } = await supabase
    .from('events')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return event
}

export async function deleteEvent(id: string) {
  const { supabase, profile } = await getProfile()

  if (!isManagerRole(profile.role as UserRole)) {
    throw new Error('Nicht berechtigt')
  }

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)

  if (error) throw new Error(error.message)
}

export async function assignUserToEvent(eventId: string, userId: string, roleInEvent: string) {
  const { supabase, profile } = await getProfile()

  if (!isManagerRole(profile.role as UserRole)) {
    throw new Error('Nicht berechtigt')
  }

  const { error } = await supabase.from('event_assignments').insert({
    event_id: eventId,
    user_id: userId,
    role_in_event: roleInEvent,
    tenant_id: profile.tenant_id,
  })

  if (error) throw new Error(error.message)
}

export async function removeUserFromEvent(eventId: string, userId: string) {
  const { supabase, profile } = await getProfile()

  if (!isManagerRole(profile.role as UserRole)) {
    throw new Error('Nicht berechtigt')
  }

  const { error } = await supabase
    .from('event_assignments')
    .delete()
    .eq('event_id', eventId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}

export async function getEventsByTenant() {
  const { supabase, profile } = await getProfile()

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .order('start_date', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function getEventById(id: string) {
  const { supabase, profile } = await getProfile()

  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      event_days(*),
      event_assignments(*, profile:profiles(*)),
      event_logistics_assignments(*, vehicle:vehicles(*), foodtruck:foodtrucks(*))
    `)
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function getMyEvents() {
  const { supabase, profile } = await getProfile()

  const { data: assignments } = await supabase
    .from('event_assignments')
    .select('event_id')
    .eq('user_id', profile.id)

  const eventIds = assignments?.map((a) => a.event_id) ?? []

  if (eventIds.length === 0) return []

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .in('id', eventIds)
    .order('start_date', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

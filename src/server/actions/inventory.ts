'use server'

import { createClient } from '@/lib/supabase/server'
import type { InventorySessionType } from '@/types'

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

export async function createInventorySession(
  eventId: string,
  dayId: string | null,
  type: InventorySessionType,
  photoUrl?: string
) {
  const { supabase, profile } = await getProfile()

  const { data, error } = await supabase
    .from('event_inventory_sessions')
    .insert({
      event_id: eventId,
      tenant_id: profile.tenant_id,
      event_day_id: dayId,
      session_type: type,
      created_by: profile.id,
      photo_url: photoUrl ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function saveInventoryItems(
  sessionId: string,
  items: { product_id: string; quantity: number }[]
) {
  const { supabase } = await getProfile()

  await supabase.from('event_inventory_items').delete().eq('session_id', sessionId)

  const { error } = await supabase.from('event_inventory_items').insert(
    items.map((item) => ({
      session_id: sessionId,
      product_id: item.product_id,
      quantity: item.quantity,
    }))
  )

  if (error) throw new Error(error.message)
}

export async function getInventoryByEvent(eventId: string) {
  const { supabase, profile } = await getProfile()

  const { data, error } = await supabase
    .from('event_inventory_sessions')
    .select(`
      *,
      creator:profiles(full_name),
      items:event_inventory_items(*, product:products(*))
    `)
    .eq('event_id', eventId)
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

export async function calculateConsumption(eventId: string) {
  const { supabase, profile } = await getProfile()

  const { data: sessions } = await supabase
    .from('event_inventory_sessions')
    .select(`
      session_type,
      items:event_inventory_items(product_id, quantity, product:products(name, unit))
    `)
    .eq('event_id', eventId)
    .eq('tenant_id', profile.tenant_id)
    .in('session_type', ['INTAKE', 'RETURN'])

  if (!sessions) return []

  const productMap = new Map<string, { name: string; unit: string; intake: number; return: number }>()

  for (const session of sessions) {
    const items = session.items as unknown as { product_id: string; quantity: number; product: { name: string; unit: string } }[]
    for (const item of items ?? []) {
      const existing = productMap.get(item.product_id) ?? {
        name: item.product?.name ?? 'Unbekannt',
        unit: item.product?.unit ?? '',
        intake: 0,
        return: 0,
      }
      if (session.session_type === 'INTAKE') {
        existing.intake += item.quantity
      } else {
        existing.return += item.quantity
      }
      productMap.set(item.product_id, existing)
    }
  }

  return Array.from(productMap.entries()).map(([productId, data]) => ({
    productId,
    name: data.name,
    unit: data.unit,
    intake: data.intake,
    return: data.return,
    consumption: data.intake - data.return,
  }))
}

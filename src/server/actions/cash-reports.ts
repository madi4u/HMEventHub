'use server'

import { createClient } from '@/lib/supabase/server'
import type { DenominationRow } from '@/types'

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

export async function getCashReport(eventId: string, dayId: string) {
  const { supabase, profile } = await getProfile()

  const { data } = await supabase
    .from('cash_reports')
    .select('*, denominations:cash_report_denominations(*)')
    .eq('event_id', eventId)
    .eq('event_day_id', dayId)
    .eq('tenant_id', profile.tenant_id)
    .single()

  return data
}

export async function saveCashReportDraft(
  reportId: string,
  denominations: DenominationRow[],
  notes: string
) {
  const { supabase } = await getProfile()

  const total = denominations.reduce((sum, d) => sum + d.subtotal, 0)

  await supabase
    .from('cash_reports')
    .update({ notes, total_amount: total })
    .eq('id', reportId)

  await supabase.from('cash_report_denominations').delete().eq('cash_report_id', reportId)
  await supabase.from('cash_report_denominations').insert(
    denominations
      .filter((d) => d.quantity > 0)
      .map((d) => ({
        cash_report_id: reportId,
        denomination_type: d.type,
        denomination_value: d.value,
        quantity: d.quantity,
        subtotal: d.subtotal,
      }))
  )
}

export async function submitCashReport(
  reportId: string,
  denominations: DenominationRow[],
  signaturePath: string,
  photoPaths: string[],
  notes: string
) {
  const { supabase, profile } = await getProfile()

  const total = denominations.reduce((sum, d) => sum + d.subtotal, 0)

  // Save denominations
  await supabase.from('cash_report_denominations').delete().eq('cash_report_id', reportId)
  await supabase.from('cash_report_denominations').insert(
    denominations
      .filter((d) => d.quantity > 0)
      .map((d) => ({
        cash_report_id: reportId,
        denomination_type: d.type,
        denomination_value: d.value,
        quantity: d.quantity,
        subtotal: d.subtotal,
      }))
  )

  const { data, error } = await supabase
    .from('cash_reports')
    .update({
      status: 'SUBMITTED',
      total_amount: total,
      notes,
      signature_file_path: signaturePath,
      cash_photo_file_path: photoPaths[0] ?? null,
      submitted_by_user_id: profile.id,
      submitted_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function getCashReportsByEvent(eventId: string) {
  const { supabase, profile } = await getProfile()

  const { data, error } = await supabase
    .from('cash_reports')
    .select('*, event_day:event_days(*), denominations:cash_report_denominations(*)')
    .eq('event_id', eventId)
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

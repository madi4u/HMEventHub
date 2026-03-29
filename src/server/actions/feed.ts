'use server'

import { createClient } from '@/lib/supabase/server'
import type { FeedCategory } from '@/types'

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

export async function createFeedEntry(
  eventId: string,
  content: string,
  category: FeedCategory,
  attachmentPaths?: string[]
) {
  const { supabase, profile } = await getProfile()

  const { data: entry, error } = await supabase
    .from('event_feed_entries')
    .insert({
      event_id: eventId,
      tenant_id: profile.tenant_id,
      user_id: profile.id,
      content: content || null,
      category,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  if (attachmentPaths && attachmentPaths.length > 0) {
    await supabase.from('event_feed_attachments').insert(
      attachmentPaths.map((path) => ({
        feed_entry_id: entry.id,
        file_path: path,
        file_type: 'image/jpeg',
        file_name: path.split('/').pop() ?? null,
      }))
    )
  }

  return entry
}

export async function getFeedByEvent(eventId: string) {
  const { supabase, profile } = await getProfile()

  const { data, error } = await supabase
    .from('event_feed_entries')
    .select(`
      *,
      author:profiles(full_name, avatar_url),
      attachments:event_feed_attachments(*)
    `)
    .eq('event_id', eventId)
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function deleteFeedEntry(id: string) {
  const { supabase, profile } = await getProfile()

  const { error } = await supabase
    .from('event_feed_entries')
    .delete()
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)

  if (error) throw new Error(error.message)
}

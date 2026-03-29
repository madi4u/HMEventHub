import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FeedClient } from './feed-client'
import { isManagerRole } from '@/lib/utils'
import type { FeedEntry as FeedEntryType, UserRole } from '@/types'

export default async function FeedPage() {
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

  const { data: entries } = await supabase
    .from('event_feed_entries')
    .select(`
      *,
      author:profiles(full_name, avatar_url),
      attachments:event_feed_attachments(*),
      events(title)
    `)
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: false })
    .limit(50)

  return <FeedClient entries={(entries ?? []) as FeedEntryType[]} />
}

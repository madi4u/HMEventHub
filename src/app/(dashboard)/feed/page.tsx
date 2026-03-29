import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { FeedEntry } from '@/components/feed/feed-entry'
import { Card, CardContent } from '@/components/ui/card'
import { MessageSquare } from 'lucide-react'
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

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Feed"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Feed' },
        ]}
      />

      {!entries || entries.length === 0 ? (
        <Card className="border-border">
          <CardContent className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Keine Feed-Einträge vorhanden</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(entries as FeedEntryType[]).map((entry) => (
            <FeedEntry key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}

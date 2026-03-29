'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FeedEntry } from '@/components/feed/feed-entry'
import { NewFeedEntryDialog } from '@/components/feed/new-feed-entry-dialog'
import type { FeedEntry as FeedEntryType } from '@/types'

interface EventFeedTabProps {
  eventId: string
  profileId: string
}

export function EventFeedTab({ eventId, profileId }: EventFeedTabProps) {
  const [entries, setEntries] = useState<FeedEntryType[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  const loadFeed = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('event_feed_entries')
      .select(`
        *,
        author:profiles(full_name, avatar_url),
        attachments:event_feed_attachments(*)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    setEntries((data as FeedEntryType[]) ?? [])
    setLoading(false)
  }, [eventId])

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  if (loading) {
    return (
      <Card className="border-border">
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Neuer Eintrag
        </Button>
      </div>

      <NewFeedEntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        eventId={eventId}
        onSuccess={loadFeed}
      />

      {entries.length === 0 ? (
        <Card className="border-border">
          <CardContent className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Keine Feed-Einträge vorhanden</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <FeedEntry key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}

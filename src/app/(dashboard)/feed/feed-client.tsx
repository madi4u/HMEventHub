'use client'

import { MessageSquare } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { FeedEntry } from '@/components/feed/feed-entry'
import { Card, CardContent } from '@/components/ui/card'
import { useTranslation } from '@/i18n'
import type { FeedEntry as FeedEntryType } from '@/types'

export function FeedClient({ entries }: { entries: FeedEntryType[] }) {
  const { t, tenantName } = useTranslation()

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t('feed.title')}
        breadcrumbs={[
          { label: tenantName || 'EventHub', href: '/dashboard' },
          { label: t('feed.title') },
        ]}
      />

      {entries.length === 0 ? (
        <Card className="border-border">
          <CardContent className="text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">{t('feed.noEntries')}</p>
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

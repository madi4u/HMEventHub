'use client'

import Link from 'next/link'
import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatDate, getStatusBadgeColor, getEventTypeLabel } from '@/lib/utils'
import { useTranslation } from '@/i18n'

interface EventRow {
  id: string
  title: string
  event_type: string
  start_date: string
  end_date: string
  status: string
  city: string | null
  teamCount: number
}

export function EventsClient({ events }: { events: EventRow[] }) {
  const { t, language } = useTranslation()

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t('events.title')}
        breadcrumbs={[
          { label: t('nav.dashboard'), href: '/dashboard' },
          { label: t('events.title') },
        ]}
        actions={
          <Link href="/events/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              {t('events.newEvent')}
            </Button>
          </Link>
        }
      />

      <Card className="border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>{t('common.title')}</TableHead>
                <TableHead>{t('common.type')}</TableHead>
                <TableHead>{t('common.date')}</TableHead>
                <TableHead>{t('events.location')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('events.team')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {t('events.noEvents')}
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id} className="border-border">
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {getEventTypeLabel(event.event_type, language)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {formatDate(event.start_date)}
                        {event.start_date !== event.end_date && ` – ${formatDate(event.end_date)}`}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {event.city ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getStatusBadgeColor(event.status)}`}
                      >
                        {t(`status.${event.status}` as Parameters<typeof t>[0]) || event.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {event.teamCount} MA
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/events/${event.id}`}>
                        <Button variant="ghost" size="sm">
                          {t('common.open')}
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

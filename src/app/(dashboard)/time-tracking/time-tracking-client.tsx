'use client'

import { PageHeader } from '@/components/layout/page-header'
import { ClockWidget } from '@/components/time-tracking/clock-widget'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { formatDateTime, formatDuration, getDurationInMinutes } from '@/lib/utils'
import { useTranslation } from '@/i18n'

interface TimeEntry {
  id: string
  clock_in: string
  clock_out: string | null
  break_minutes: number | null
  status: string
  events: { title: string } | null
}

interface TimeTrackingClientProps {
  profileId: string
  assignedEvents: { id: string; title: string }[]
  history: TimeEntry[]
}

export function TimeTrackingClient({ profileId, assignedEvents, history }: TimeTrackingClientProps) {
  const { t } = useTranslation()

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-500/20 text-green-400 border-green-500/30',
    COMPLETED: 'bg-secondary text-secondary-foreground border-border',
    APPROVED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t('timeTracking.title')}
        breadcrumbs={[{ label: t('timeTracking.title') }]}
      />

      <ClockWidget profileId={profileId} assignedEvents={assignedEvents} />

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">{t('timeTracking.myEntries')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>{t('timeTracking.event')}</TableHead>
                <TableHead>{t('timeTracking.clockedIn')}</TableHead>
                <TableHead>{t('timeTracking.clockedOut')}</TableHead>
                <TableHead>{t('timeTracking.breakMinutes')}</TableHead>
                <TableHead>{t('timeTracking.duration')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    {t('timeTracking.noEntries')}
                  </TableCell>
                </TableRow>
              ) : (
                history.map((entry) => {
                  const duration = getDurationInMinutes(entry.clock_in, entry.clock_out)
                  const netDuration = Math.max(0, duration - (entry.break_minutes ?? 0))
                  return (
                    <TableRow key={entry.id} className="border-border">
                      <TableCell className="font-medium text-sm">
                        {entry.events?.title ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm">{formatDateTime(entry.clock_in)}</TableCell>
                      <TableCell className="text-sm">
                        {entry.clock_out ? formatDateTime(entry.clock_out) : (
                          <span className="text-green-400">{t('status.ACTIVE')}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{entry.break_minutes ?? 0} min</TableCell>
                      <TableCell className="text-sm">
                        {entry.clock_out ? formatDuration(netDuration) : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${statusColors[entry.status] ?? ''}`}
                        >
                          {t(`status.${entry.status}` as Parameters<typeof t>[0]) || entry.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

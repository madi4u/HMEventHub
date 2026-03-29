'use client'

import Link from 'next/link'
import { CalendarDays, MapPin, Clock } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, getStatusBadgeColor, getEventTypeLabel } from '@/lib/utils'
import { useTranslation } from '@/i18n'

interface EventItem {
  id: string
  title: string
  event_type: string
  start_date: string
  end_date: string
  status: string
  city: string | null
  start_time: string | null
}

interface MyEventsClientProps {
  upcomingEvents: EventItem[]
  pastEvents: EventItem[]
}

function EventCard({ event, highlighted }: { event: EventItem; highlighted?: boolean }) {
  const { t, language } = useTranslation()
  return (
    <Link href={`/my-events/${event.id}`}>
      <Card className={`border-border hover:bg-accent/50 transition-colors cursor-pointer ${highlighted ? 'border-sidebar-primary/50' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-medium">{event.title}</CardTitle>
            <Badge
              variant="outline"
              className={`text-xs flex-shrink-0 ${getStatusBadgeColor(event.status)}`}
            >
              {t(`status.${event.status}` as Parameters<typeof t>[0]) || event.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>
              {formatDate(event.start_date)}
              {event.start_date !== event.end_date && ` – ${formatDate(event.end_date)}`}
            </span>
          </div>
          {event.start_time && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{event.start_time}</span>
            </div>
          )}
          {event.city && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>{event.city}</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">{getEventTypeLabel(event.event_type, language)}</p>
        </CardContent>
      </Card>
    </Link>
  )
}

export function MyEventsClient({ upcomingEvents, pastEvents }: MyEventsClientProps) {
  const { t } = useTranslation()
  const total = upcomingEvents.length + pastEvents.length

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t('events.myEvents')}
        breadcrumbs={[{ label: t('events.myEvents') }]}
      />

      {total === 0 ? (
        <Card className="border-border">
          <CardContent className="text-center py-12">
            <CalendarDays className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">{t('events.noAssignedEvents')}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {upcomingEvents.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">
                {t('events.upcomingEvents')} ({upcomingEvents.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} highlighted />
                ))}
              </div>
            </div>
          )}

          {pastEvents.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">
                {t('events.pastEvents')} ({pastEvents.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

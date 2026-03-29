import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarDays, MapPin, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, getStatusBadgeColor, getEventTypeLabel } from '@/lib/utils'

export default async function MyEventsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/login')

  // Get assigned events
  const { data: assignments } = await supabase
    .from('event_assignments')
    .select('event_id')
    .eq('user_id', profile.id)

  const eventIds = assignments?.map((a) => a.event_id) ?? []

  const today = new Date().toISOString().split('T')[0]

  let events: Array<{
    id: string
    title: string
    event_type: string
    start_date: string
    end_date: string
    status: string
    city: string | null
    start_time: string | null
  }> = []

  if (eventIds.length > 0) {
    const { data } = await supabase
      .from('events')
      .select('id, title, event_type, start_date, end_date, status, city, start_time')
      .in('id', eventIds)
      .order('start_date', { ascending: true })

    events = data ?? []
  }

  const upcomingEvents = events.filter((e) => e.start_date >= today)
  const pastEvents = events.filter((e) => e.end_date < today)

  const statusLabels: Record<string, string> = {
    DRAFT: 'Entwurf',
    CONFIRMED: 'Bestätigt',
    ACTIVE: 'Aktiv',
    COMPLETED: 'Abgeschlossen',
    CANCELLED: 'Storniert',
  }

  const langMap: Record<string, string> = { de: 'de', en: 'en', es: 'es' }
  const lang = langMap[profile.preferred_language] ?? 'de'

  function EventCard({ event, highlighted }: { event: typeof events[0]; highlighted?: boolean }) {
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
                {statusLabels[event.status] ?? event.status}
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
            <p className="text-xs text-muted-foreground">{getEventTypeLabel(event.event_type, lang)}</p>
          </CardContent>
        </Card>
      </Link>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Meine Veranstaltungen"
        breadcrumbs={[{ label: 'Meine Veranstaltungen' }]}
      />

      {events.length === 0 ? (
        <Card className="border-border">
          <CardContent className="text-center py-12">
            <CalendarDays className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Keine Veranstaltungen zugewiesen</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {upcomingEvents.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">
                Bevorstehende Veranstaltungen ({upcomingEvents.length})
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
                Vergangene Veranstaltungen ({pastEvents.length})
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

import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { FileDown, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getStatusBadgeColor, formatDate, isManagerRole } from '@/lib/utils'
import { EventOverviewTab } from './components/event-overview-tab'
import { EventTeamTab } from './components/event-team-tab'
import { EventLogisticsTab } from './components/event-logistics-tab'
import { EventDocumentsTab } from './components/event-documents-tab'
import { EventTimeTrackingTab } from './components/event-time-tracking-tab'
import { EventInventoryTab } from './components/event-inventory-tab'
import { EventChecklistsTab } from './components/event-checklists-tab'
import { EventCashTab } from './components/event-cash-tab'
import { EventFeedTab } from './components/event-feed-tab'
import type { UserRole } from '@/types'

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (!event) notFound()

  const isManager = isManagerRole(profile.role as UserRole)

  const { data: eventDays } = await supabase
    .from('event_days')
    .select('*')
    .eq('event_id', id)
    .order('event_date', { ascending: true })

  const statusLabels: Record<string, string> = {
    DRAFT: 'Entwurf',
    CONFIRMED: 'Bestätigt',
    ACTIVE: 'Aktiv',
    COMPLETED: 'Abgeschlossen',
    CANCELLED: 'Storniert',
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title={event.title}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Veranstaltungen', href: '/events' },
          { label: event.title },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`${getStatusBadgeColor(event.status)}`}
            >
              {statusLabels[event.status] ?? event.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {formatDate(event.start_date)}
              {event.start_date !== event.end_date && ` – ${formatDate(event.end_date)}`}
            </span>
            {isManager && (
              <>
                <a href={`/api/events/${id}/export-pdf`} target="_blank">
                  <Button variant="outline" size="sm">
                    <FileDown className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                </a>
                <Link href={`/events/${id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Pencil className="h-4 w-4 mr-1" />
                    Bearbeiten
                  </Button>
                </Link>
              </>
            )}
          </div>
        }
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-secondary/50 p-1">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="logistics">Logistik</TabsTrigger>
          <TabsTrigger value="documents">Dokumente</TabsTrigger>
          <TabsTrigger value="time">Zeiterfassung</TabsTrigger>
          <TabsTrigger value="inventory">Inventur</TabsTrigger>
          <TabsTrigger value="checklists">Kontrollblätter</TabsTrigger>
          <TabsTrigger value="cash">Kassenblatt</TabsTrigger>
          <TabsTrigger value="feed">Feed</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <EventOverviewTab event={event} isManager={isManager} />
        </TabsContent>
        <TabsContent value="team">
          <EventTeamTab eventId={id} tenantId={event.tenant_id} isManager={isManager} />
        </TabsContent>
        <TabsContent value="logistics">
          <EventLogisticsTab eventId={id} tenantId={event.tenant_id} isManager={isManager} />
        </TabsContent>
        <TabsContent value="documents">
          <EventDocumentsTab eventId={id} tenantId={event.tenant_id} isManager={isManager} />
        </TabsContent>
        <TabsContent value="time">
          <EventTimeTrackingTab eventId={id} tenantId={event.tenant_id} isManager={isManager} />
        </TabsContent>
        <TabsContent value="inventory">
          <EventInventoryTab eventId={id} eventDays={eventDays ?? []} tenantId={event.tenant_id} />
        </TabsContent>
        <TabsContent value="checklists">
          <EventChecklistsTab eventId={id} tenantId={event.tenant_id} isManager={isManager} />
        </TabsContent>
        <TabsContent value="cash">
          <EventCashTab eventId={id} eventDays={eventDays ?? []} tenantId={event.tenant_id} isManager={isManager} />
        </TabsContent>
        <TabsContent value="feed">
          <EventFeedTab eventId={id} profileId={profile.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

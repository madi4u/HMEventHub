import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getStatusBadgeColor, formatDate } from '@/lib/utils'
import { EventOverviewTab } from '../../events/[id]/components/event-overview-tab'
import { EventFeedTab } from '../../events/[id]/components/event-feed-tab'
import { EventChecklistsTab } from '../../events/[id]/components/event-checklists-tab'
import { EventCashTab } from '../../events/[id]/components/event-cash-tab'
import { EventInventoryTab } from '../../events/[id]/components/event-inventory-tab'

export default async function MyEventDetailPage({
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

  // Verify assignment
  const { data: assignment } = await supabase
    .from('event_assignments')
    .select('id')
    .eq('event_id', id)
    .eq('user_id', profile.id)
    .single()

  if (!assignment) notFound()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (!event) notFound()

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
          { label: 'Meine Veranstaltungen', href: '/my-events' },
          { label: event.title },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={getStatusBadgeColor(event.status)}
            >
              {statusLabels[event.status] ?? event.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {formatDate(event.start_date)}
              {event.start_date !== event.end_date && ` – ${formatDate(event.end_date)}`}
            </span>
          </div>
        }
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-secondary/50 p-1">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="inventory">Inventur</TabsTrigger>
          <TabsTrigger value="checklists">Kontrollblätter</TabsTrigger>
          <TabsTrigger value="cash">Kassenblatt</TabsTrigger>
          <TabsTrigger value="feed">Feed</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* Employee sees no internal_notes */}
          <EventOverviewTab event={{ ...event, internal_notes: null }} isManager={false} />
        </TabsContent>
        <TabsContent value="inventory">
          <EventInventoryTab eventId={id} eventDays={eventDays ?? []} tenantId={event.tenant_id} />
        </TabsContent>
        <TabsContent value="checklists">
          <EventChecklistsTab eventId={id} tenantId={event.tenant_id} isManager={false} />
        </TabsContent>
        <TabsContent value="cash">
          <EventCashTab eventId={id} eventDays={eventDays ?? []} tenantId={event.tenant_id} isManager={false} />
        </TabsContent>
        <TabsContent value="feed">
          <EventFeedTab eventId={id} profileId={profile.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { InventoryForm } from '@/components/inventory/inventory-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import type { Product, EventDay } from '@/types'

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/login')

  const { data: assignments } = await supabase
    .from('event_assignments')
    .select('event_id, events(id, title, status)')
    .eq('user_id', profile.id)

  const activeEventIds = assignments
    ?.filter((a) => {
      const ev = a.events as unknown as { status: string } | null
      return ev && ['CONFIRMED', 'ACTIVE'].includes(ev.status)
    })
    .map((a) => a.event_id) ?? []

  const selectedEventId = params.eventId ?? activeEventIds[0] ?? ''

  let eventDays: EventDay[] = []
  if (selectedEventId) {
    const { data } = await supabase
      .from('event_days')
      .select('*')
      .eq('event_id', selectedEventId)
      .order('event_date', { ascending: true })
    eventDays = (data as EventDay[]) ?? []
  }

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .eq('is_active', true)
    .order('name', { ascending: true })

  const { data: recentSessions } = await supabase
    .from('event_inventory_sessions')
    .select('*, creator:profiles(full_name), items:event_inventory_items(id)')
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: false })
    .limit(10)

  const sessionTypeLabels: Record<string, string> = {
    INTAKE: 'Eingang',
    RETURN: 'Rückgabe',
    COUNT: 'Zählung',
  }

  const sessionTypeColors: Record<string, string> = {
    INTAKE: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    RETURN: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    COUNT: 'bg-secondary text-secondary-foreground border-border',
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Inventur"
        breadcrumbs={[{ label: 'Inventur' }]}
      />

      {selectedEventId && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Neue Inventur erfassen</CardTitle>
          </CardHeader>
          <CardContent>
            <InventoryForm
              eventId={selectedEventId}
              eventDays={eventDays}
              products={(products as Product[]) ?? []}
              tenantId={profile.tenant_id ?? ''}
            />
          </CardContent>
        </Card>
      )}

      {!selectedEventId && (
        <Card className="border-border">
          <CardContent className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Keine aktive Veranstaltung zugewiesen</p>
          </CardContent>
        </Card>
      )}

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Letzte Inventursessions</CardTitle>
        </CardHeader>
        <CardContent>
          {!recentSessions || recentSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Keine Inventursessions vorhanden
            </p>
          ) : (
            <div className="space-y-2">
              {recentSessions.map((session) => {
                const creator = session.creator as unknown as { full_name: string } | null
                const itemCount = (session.items as unknown as { id: string }[])?.length ?? 0
                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <div>
                      <Badge
                        variant="outline"
                        className={`text-xs ${sessionTypeColors[session.session_type] ?? ''}`}
                      >
                        {sessionTypeLabels[session.session_type] ?? session.session_type}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {creator?.full_name ?? 'Unbekannt'} · {formatDateTime(session.created_at)} · {itemCount} Artikel
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

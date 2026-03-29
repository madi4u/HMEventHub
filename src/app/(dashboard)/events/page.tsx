import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate, getStatusBadgeColor, getEventTypeLabel, isManagerRole } from '@/lib/utils'
import type { UserRole } from '@/types'

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string; q?: string }>
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
  if (!isManagerRole(profile.role as UserRole)) redirect('/my-events')

  let query = supabase
    .from('events')
    .select(`
      *,
      assignments:event_assignments(count)
    `)
    .eq('tenant_id', profile.tenant_id)
    .order('start_date', { ascending: false })

  if (params.status) {
    query = query.eq('status', params.status)
  }
  if (params.type) {
    query = query.eq('event_type', params.type)
  }
  if (params.q) {
    query = query.ilike('title', `%${params.q}%`)
  }

  const { data: events } = await query

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
        title="Veranstaltungen"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Veranstaltungen' },
        ]}
        actions={
          <Link href="/events/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Neue Veranstaltung
            </Button>
          </Link>
        }
      />

      <Card className="border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Titel</TableHead>
                <TableHead>Typ</TableHead>
                <TableHead>Datum</TableHead>
                <TableHead>Ort</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!events || events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Keine Veranstaltungen gefunden
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id} className="border-border">
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {getEventTypeLabel(event.event_type)}
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
                        {statusLabels[event.status] ?? event.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {(event.assignments as { count: number }[])?.[0]?.count ?? 0} MA
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/events/${event.id}`}>
                        <Button variant="ghost" size="sm">
                          Öffnen
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

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { ClockWidget } from '@/components/time-tracking/clock-widget'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDateTime, formatDuration, getDurationInMinutes } from '@/lib/utils'

export default async function TimeTrackingPage() {
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
    .select('event_id, events(id, title, status)')
    .eq('user_id', profile.id)

  const assignedEvents = assignments
    ?.filter((a) => {
      const ev = a.events as unknown as { status: string } | null
      return ev && ['CONFIRMED', 'ACTIVE'].includes(ev.status)
    })
    .map((a) => {
      const ev = a.events as unknown as { id: string; title: string } | null
      return { id: a.event_id, title: ev?.title ?? 'Unbekannt' }
    }) ?? []

  // Get time history
  const { data: history } = await supabase
    .from('time_entries')
    .select('*, events(title)')
    .eq('user_id', profile.id)
    .order('clock_in', { ascending: false })
    .limit(20)

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-500/20 text-green-400 border-green-500/30',
    COMPLETED: 'bg-secondary text-secondary-foreground border-border',
    APPROVED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  }

  const statusLabels: Record<string, string> = {
    ACTIVE: 'Aktiv',
    COMPLETED: 'Abgeschlossen',
    APPROVED: 'Genehmigt',
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Zeiterfassung"
        breadcrumbs={[{ label: 'Zeiterfassung' }]}
      />

      <ClockWidget profileId={profile.id} assignedEvents={assignedEvents} />

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Meine Zeiteinträge</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Veranstaltung</TableHead>
                <TableHead>Einstempel</TableHead>
                <TableHead>Ausstempel</TableHead>
                <TableHead>Pause</TableHead>
                <TableHead>Dauer</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!history || history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    Keine Zeiteinträge vorhanden
                  </TableCell>
                </TableRow>
              ) : (
                history.map((entry) => {
                  const ev = entry.events as unknown as { title: string } | null
                  const duration = getDurationInMinutes(entry.clock_in, entry.clock_out)
                  const netDuration = Math.max(0, duration - (entry.break_minutes ?? 0))
                  return (
                    <TableRow key={entry.id} className="border-border">
                      <TableCell className="font-medium text-sm">
                        {ev?.title ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm">{formatDateTime(entry.clock_in)}</TableCell>
                      <TableCell className="text-sm">
                        {entry.clock_out ? formatDateTime(entry.clock_out) : (
                          <span className="text-green-400">Aktiv</span>
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
                          {statusLabels[entry.status] ?? entry.status}
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

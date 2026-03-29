'use client'

import { useEffect, useState, useCallback } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import type { TimeEntry } from '@/types'

interface EventTimeTrackingTabProps {
  eventId: string
  tenantId: string
  isManager: boolean
}

export function EventTimeTrackingTab({ eventId, isManager }: EventTimeTrackingTabProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)

  const loadEntries = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('time_entries')
      .select('*, profile:profiles(full_name, email)')
      .eq('event_id', eventId)
      .order('clock_in', { ascending: false })

    setEntries((data as TimeEntry[]) ?? [])
    setLoading(false)
  }, [eventId])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  async function handleApprove(entryId: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('time_entries')
      .update({ status: 'APPROVED' })
      .eq('id', entryId)

    if (error) {
      toast.error('Fehler beim Genehmigen')
      return
    }

    toast.success('Genehmigt')
    await loadEntries()
  }

  const statusBadgeColors: Record<string, string> = {
    ACTIVE: 'bg-green-500/20 text-green-400 border-green-500/30',
    COMPLETED: 'bg-secondary text-secondary-foreground border-border',
    APPROVED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  }

  const statusLabels: Record<string, string> = {
    ACTIVE: 'Aktiv',
    COMPLETED: 'Abgeschlossen',
    APPROVED: 'Genehmigt',
  }

  const totalMinutes = entries
    .filter((e) => e.status !== 'ACTIVE')
    .reduce((sum, e) => {
      const dur = getDurationInMinutes(e.clock_in, e.clock_out) - (e.break_minutes ?? 0)
      return sum + Math.max(0, dur)
    }, 0)

  if (loading) {
    return (
      <Card className="border-border">
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Einträge</p>
            <p className="text-2xl font-bold">{entries.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Gesamtstunden</p>
            <p className="text-2xl font-bold">{formatDuration(totalMinutes)}</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Ausstehend</p>
            <p className="text-2xl font-bold">
              {entries.filter((e) => e.status === 'COMPLETED').length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Zeiteinträge</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Mitarbeiter</TableHead>
                <TableHead>Einstempel</TableHead>
                <TableHead>Ausstempel</TableHead>
                <TableHead>Pause</TableHead>
                <TableHead>Dauer</TableHead>
                <TableHead>Status</TableHead>
                {isManager && <TableHead className="text-right">Aktion</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isManager ? 7 : 6} className="text-center py-6 text-muted-foreground">
                    Keine Zeiteinträge
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => {
                  const p = entry.profile as unknown as { full_name: string } | null
                  const duration = getDurationInMinutes(entry.clock_in, entry.clock_out)
                  const netDuration = Math.max(0, duration - (entry.break_minutes ?? 0))
                  return (
                    <TableRow key={entry.id} className="border-border">
                      <TableCell className="font-medium">{p?.full_name ?? '—'}</TableCell>
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
                          className={`text-xs ${statusBadgeColors[entry.status] ?? ''}`}
                        >
                          {statusLabels[entry.status] ?? entry.status}
                        </Badge>
                      </TableCell>
                      {isManager && (
                        <TableCell className="text-right">
                          {entry.status === 'COMPLETED' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApprove(entry.id)}
                              className="h-7 text-xs"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Genehmigen
                            </Button>
                          )}
                        </TableCell>
                      )}
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

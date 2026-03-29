'use client'

import { useEffect, useState, useCallback } from 'react'
import { Check, Loader2, MapPin, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { formatDateTime, formatDuration, getDurationInMinutes } from '@/lib/utils'
interface TimeEntryWithProfile {
  id: string
  event_id: string
  user_id: string
  tenant_id: string
  clock_in: string
  clock_out: string | null
  break_minutes: number | null
  status: string
  admin_note: string | null
  location_in: { lat: number; lng: number; accuracy?: number } | null
  location_out: { lat: number; lng: number; accuracy?: number } | null
  profile: { full_name: string; email: string } | null
}

interface EventTimeTrackingTabProps {
  eventId: string
  tenantId: string
  isManager: boolean
}

const editSchema = z.object({
  clock_in: z.string().min(1, 'Pflichtfeld'),
  clock_out: z.string().min(1, 'Pflichtfeld'),
  break_minutes: z.coerce.number().min(0),
  admin_note: z.string().max(500).optional(),
})
type EditForm = z.infer<typeof editSchema>

function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function LocationBadge({ loc }: { loc: { lat: number; lng: number; accuracy?: number } | null }) {
  if (!loc) return <span className="text-muted-foreground text-xs">—</span>
  const url = `https://www.google.com/maps?q=${loc.lat},${loc.lng}`
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline">
      <MapPin className="h-3 w-3" />
      {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
      {loc.accuracy && <span className="text-muted-foreground">(±{Math.round(loc.accuracy)}m)</span>}
    </a>
  )
}

function EditEntryDialog({
  entry, onSaved,
}: {
  entry: TimeEntryWithProfile
  onSaved: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      clock_in: toLocalInput(entry.clock_in),
      clock_out: toLocalInput(entry.clock_out),
      break_minutes: entry.break_minutes ?? 0,
      admin_note: entry.admin_note ?? '',
    },
  })

  function handleOpen(v: boolean) {
    setOpen(v)
    if (v) reset({
      clock_in: toLocalInput(entry.clock_in),
      clock_out: toLocalInput(entry.clock_out),
      break_minutes: entry.break_minutes ?? 0,
      admin_note: entry.admin_note ?? '',
    })
  }

  async function onSubmit(data: EditForm) {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('time_entries')
        .update({
          clock_in: new Date(data.clock_in).toISOString(),
          clock_out: new Date(data.clock_out).toISOString(),
          break_minutes: data.break_minutes,
          admin_note: data.admin_note || null,
        })
        .eq('id', entry.id)

      if (error) { toast.error(error.message); return }
      toast.success('Zeiteintrag aktualisiert')
      setOpen(false)
      onSaved()
    } catch { toast.error('Fehler') } finally { setLoading(false) }
  }

  const p = entry.profile
  return (
    <>
      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleOpen(true)}>
        <Pencil className="h-3 w-3 mr-1" />Bearbeiten
      </Button>
      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Zeiteintrag bearbeiten — {p?.full_name ?? '—'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Einstempel</Label>
                <Input type="datetime-local" {...register('clock_in')} disabled={loading} className="text-xs" />
                {errors.clock_in && <p className="text-xs text-destructive">{errors.clock_in.message}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ausstempel</Label>
                <Input type="datetime-local" {...register('clock_out')} disabled={loading} className="text-xs" />
                {errors.clock_out && <p className="text-xs text-destructive">{errors.clock_out.message}</p>}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Pause (Minuten)</Label>
              <Input type="number" min={0} {...register('break_minutes')} disabled={loading} className="max-w-[120px] text-xs" />
            </div>

            {/* Geolocation */}
            <div className="rounded-lg border border-border p-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Erfasste Standorte</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20">Einstempel:</span>
                <LocationBadge loc={entry.location_in} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-20">Ausstempel:</span>
                <LocationBadge loc={entry.location_out} />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Notiz (Begründung für Änderung)</Label>
              <Textarea
                {...register('admin_note')}
                placeholder="z.B. Ausstempel vergessen, laut Dienstplan bis 22:00 Uhr..."
                disabled={loading}
                className="text-xs resize-none"
                rows={3}
              />
              {errors.admin_note && <p className="text-xs text-destructive">{errors.admin_note.message}</p>}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Speichern'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function EventTimeTrackingTab({ eventId, isManager }: EventTimeTrackingTabProps) {
  const [entries, setEntries] = useState<TimeEntryWithProfile[]>([])
  const [loading, setLoading] = useState(true)

  const loadEntries = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('time_entries')
      .select('*, profile:profiles(full_name, email)')
      .eq('event_id', eventId)
      .order('clock_in', { ascending: false })

    setEntries((data as TimeEntryWithProfile[]) ?? [])
    setLoading(false)
  }, [eventId])

  useEffect(() => { loadEntries() }, [loadEntries])

  async function handleApprove(entryId: string) {
    const supabase = createClient()
    const { error } = await supabase.from('time_entries').update({ status: 'APPROVED' }).eq('id', entryId)
    if (error) { toast.error('Fehler beim Genehmigen'); return }
    toast.success('Genehmigt')
    await loadEntries()
  }

  const statusBadgeColors: Record<string, string> = {
    ACTIVE: 'bg-green-500/20 text-green-400 border-green-500/30',
    COMPLETED: 'bg-secondary text-secondary-foreground border-border',
    APPROVED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  }
  const statusLabels: Record<string, string> = {
    ACTIVE: 'Aktiv', COMPLETED: 'Abgeschlossen', APPROVED: 'Genehmigt',
  }

  const totalMinutes = entries
    .filter((e) => e.status !== 'ACTIVE')
    .reduce((sum, e) => sum + Math.max(0, getDurationInMinutes(e.clock_in, e.clock_out) - (e.break_minutes ?? 0)), 0)

  if (loading) {
    return (
      <Card className="border-border">
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const colSpan = isManager ? 8 : 6

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
            <p className="text-2xl font-bold">{entries.filter((e) => e.status === 'COMPLETED').length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border">
        <CardHeader><CardTitle className="text-base">Zeiteinträge</CardTitle></CardHeader>
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
                {isManager && <TableHead>Standort</TableHead>}
                {isManager && <TableHead className="text-right">Aktion</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colSpan} className="text-center py-6 text-muted-foreground">
                    Keine Zeiteinträge
                  </TableCell>
                </TableRow>
              ) : entries.map((entry) => {
                const p = entry.profile
                const netDuration = Math.max(0, getDurationInMinutes(entry.clock_in, entry.clock_out) - (entry.break_minutes ?? 0))
                return (
                  <>
                    <TableRow key={entry.id} className="border-border">
                      <TableCell className="font-medium text-sm">{p?.full_name ?? '—'}</TableCell>
                      <TableCell className="text-sm">{formatDateTime(entry.clock_in)}</TableCell>
                      <TableCell className="text-sm">
                        {entry.clock_out ? formatDateTime(entry.clock_out) : <span className="text-green-400">Aktiv</span>}
                      </TableCell>
                      <TableCell className="text-sm">{entry.break_minutes ?? 0} min</TableCell>
                      <TableCell className="text-sm">{entry.clock_out ? formatDuration(netDuration) : '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${statusBadgeColors[entry.status] ?? ''}`}>
                          {statusLabels[entry.status] ?? entry.status}
                        </Badge>
                      </TableCell>
                      {isManager && (
                        <TableCell>
                          <div className="space-y-1">
                            <LocationBadge loc={entry.location_in} />
                            <LocationBadge loc={entry.location_out} />
                          </div>
                        </TableCell>
                      )}
                      {isManager && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {entry.status === 'COMPLETED' && (
                              <Button variant="outline" size="sm" onClick={() => handleApprove(entry.id)} className="h-7 text-xs">
                                <Check className="h-3 w-3 mr-1" />Genehmigen
                              </Button>
                            )}
                            <EditEntryDialog entry={entry} onSaved={loadEntries} />
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                    {isManager && entry.admin_note && (
                      <TableRow key={`${entry.id}-note`} className="border-border bg-muted/30">
                        <TableCell colSpan={colSpan} className="py-1.5 px-4">
                          <span className="text-xs text-muted-foreground">Notiz: </span>
                          <span className="text-xs">{entry.admin_note}</span>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

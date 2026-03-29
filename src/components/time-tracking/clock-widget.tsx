'use client'

import { useState, useEffect, useCallback } from 'react'
import { Play, Square, Coffee, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { formatDuration } from '@/lib/utils'

interface AssignedEvent {
  id: string
  title: string
}

interface ActiveEntry {
  id: string
  event_id: string
  clock_in: string
  break_minutes: number
  break_start?: string | null
  status: string
}

interface ClockWidgetProps {
  profileId: string
  assignedEvents: AssignedEvent[]
}

type ClockStatus = 'IDLE' | 'CLOCKED_IN' | 'ON_BREAK'

export function ClockWidget({ profileId, assignedEvents }: ClockWidgetProps) {
  const [status, setStatus] = useState<ClockStatus>('IDLE')
  const [activeEntry, setActiveEntry] = useState<ActiveEntry | null>(null)
  const [selectedEventId, setSelectedEventId] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [loading, setLoading] = useState(false)

  const loadActiveEntry = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', profileId)
      .eq('status', 'ACTIVE')
      .single()

    if (data) {
      setActiveEntry(data as ActiveEntry)
      setStatus('CLOCKED_IN')
      setSelectedEventId(data.event_id)
    }
  }, [profileId])

  useEffect(() => {
    loadActiveEntry()
  }, [loadActiveEntry])

  // Live timer
  useEffect(() => {
    if (!activeEntry || status === 'IDLE') {
      setElapsed(0)
      return
    }

    const clockIn = new Date(activeEntry.clock_in).getTime()

    const tick = () => {
      const now = Date.now()
      const totalMs = now - clockIn
      const totalMinutes = Math.floor(totalMs / 1000 / 60)
      const netMinutes = Math.max(0, totalMinutes - (activeEntry.break_minutes ?? 0))
      setElapsed(netMinutes)
    }

    tick()
    const interval = setInterval(tick, 1000 * 30)
    return () => clearInterval(interval)
  }, [activeEntry, status])

  async function getLocation(): Promise<{ lat: number; lng: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null)
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 5000 }
      )
    })
  }

  async function handleClockIn() {
    if (!selectedEventId) {
      toast.error('Bitte wählen Sie eine Veranstaltung aus')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single()

      const location = await getLocation()

      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          user_id: profileId,
          event_id: selectedEventId,
          tenant_id: profile?.tenant_id,
          clock_in: new Date().toISOString(),
          status: 'ACTIVE',
          location_in: location,
          break_minutes: 0,
        })
        .select()
        .single()

      if (error) {
        toast.error('Fehler beim Einstempeln')
        return
      }

      setActiveEntry(data as ActiveEntry)
      setStatus('CLOCKED_IN')
      toast.success('Eingestempelt!')
    } finally {
      setLoading(false)
    }
  }

  async function handleClockOut() {
    if (!activeEntry) return
    setLoading(true)
    try {
      const supabase = createClient()
      const location = await getLocation()

      await supabase
        .from('time_entries')
        .update({
          clock_out: new Date().toISOString(),
          status: 'COMPLETED',
          location_out: location,
        })
        .eq('id', activeEntry.id)

      setActiveEntry(null)
      setStatus('IDLE')
      setElapsed(0)
      toast.success('Ausgestempelt!')
    } finally {
      setLoading(false)
    }
  }

  async function handleBreakToggle() {
    if (!activeEntry) return
    setLoading(true)
    try {
      const supabase = createClient()

      if (status === 'ON_BREAK') {
        // End break
        const breakStart = activeEntry.break_start
          ? new Date(activeEntry.break_start).getTime()
          : Date.now()
        const breakMinutes = Math.floor((Date.now() - breakStart) / 1000 / 60)
        const totalBreak = (activeEntry.break_minutes ?? 0) + breakMinutes

        await supabase
          .from('time_entries')
          .update({ break_minutes: totalBreak })
          .eq('id', activeEntry.id)

        setActiveEntry((prev) => prev ? { ...prev, break_minutes: totalBreak, break_start: null } : null)
        setStatus('CLOCKED_IN')
        toast.success('Pause beendet')
      } else {
        // Start break
        setActiveEntry((prev) => prev ? { ...prev, break_start: new Date().toISOString() } : null)
        setStatus('ON_BREAK')
        toast.success('Pause gestartet')
      }
    } finally {
      setLoading(false)
    }
  }

  const selectedEvent = assignedEvents.find((e) => e.id === selectedEventId)

  return (
    <Card className="border-border">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center gap-6">
          {/* Event Selection */}
          {status === 'IDLE' && (
            <div className="w-full max-w-xs">
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger>
                  <SelectValue placeholder="Veranstaltung auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {assignedEvents.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Event Name when clocked in */}
          {status !== 'IDLE' && selectedEvent && (
            <p className="text-sm font-medium text-muted-foreground">{selectedEvent.title}</p>
          )}

          {/* Status Badge */}
          <Badge
            variant="outline"
            className={
              status === 'IDLE'
                ? 'bg-muted text-muted-foreground border-border'
                : status === 'ON_BREAK'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                : 'bg-green-500/20 text-green-400 border-green-500/30'
            }
          >
            {status === 'IDLE' ? 'Nicht eingestempelt' : status === 'ON_BREAK' ? 'Pause' : 'Eingestempelt'}
          </Badge>

          {/* Live Timer */}
          <div className="text-5xl font-mono font-bold tabular-nums">
            {status === 'IDLE'
              ? '00:00'
              : `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {status === 'IDLE' ? (
              <Button
                size="lg"
                onClick={handleClockIn}
                disabled={loading || !selectedEventId}
                className="w-32"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Einstempeln
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={handleClockOut}
                  disabled={loading}
                  className="w-36"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Ausstempeln
                    </>
                  )}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleBreakToggle}
                  disabled={loading}
                >
                  <Coffee className="h-4 w-4 mr-2" />
                  {status === 'ON_BREAK' ? 'Pause Ende' : 'Pause'}
                </Button>
              </>
            )}
          </div>

          {activeEntry && (
            <p className="text-xs text-muted-foreground">
              Eingestempelt seit {new Date(activeEntry.clock_in).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
              {activeEntry.break_minutes > 0 && ` · Pause: ${activeEntry.break_minutes} min`}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

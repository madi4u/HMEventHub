'use client'

import { useEffect, useState, useCallback } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import type { InventorySession, EventDay } from '@/types'
import Link from 'next/link'

interface EventInventoryTabProps {
  eventId: string
  eventDays: EventDay[]
  tenantId: string
}

export function EventInventoryTab({ eventId, eventDays }: EventInventoryTabProps) {
  const [sessions, setSessions] = useState<InventorySession[]>([])
  const [loading, setLoading] = useState(true)

  const loadSessions = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('event_inventory_sessions')
      .select(`
        *,
        creator:profiles(full_name),
        items:event_inventory_items(id)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    setSessions((data as InventorySession[]) ?? [])
    setLoading(false)
  }, [eventId])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

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
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Inventursessions ({sessions.length})</CardTitle>
        <Link href={`/inventory?eventId=${eventId}`}>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Neue Inventur
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Keine Inventursessions vorhanden
          </p>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => {
              const creator = session.creator as unknown as { full_name: string } | null
              const itemCount = (session.items as unknown as { id: string }[])?.length ?? 0
              const day = eventDays.find((d) => d.id === session.event_day_id)
              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${sessionTypeColors[session.session_type] ?? ''}`}
                      >
                        {sessionTypeLabels[session.session_type] ?? session.session_type}
                      </Badge>
                      {day && (
                        <span className="text-xs text-muted-foreground">{day.day_label}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {creator?.full_name ?? 'Unbekannt'} · {formatDateTime(session.created_at)}
                      {' '}· {itemCount} Artikel
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

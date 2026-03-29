'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency, getStatusBadgeColor } from '@/lib/utils'
import type { CashReport, EventDay } from '@/types'

interface EventCashTabProps {
  eventId: string
  eventDays: EventDay[]
  tenantId: string
  isManager: boolean
}

export function EventCashTab({ eventId, eventDays, isManager }: EventCashTabProps) {
  const [reports, setReports] = useState<CashReport[]>([])
  const [loading, setLoading] = useState(true)

  const loadReports = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('cash_reports')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })

    setReports((data as CashReport[]) ?? [])
    setLoading(false)
  }, [eventId])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const statusLabels: Record<string, string> = {
    OPEN: 'Offen',
    SUBMITTED: 'Eingereicht',
    FINAL: 'Final',
  }

  const totalRevenue = reports
    .filter((r) => r.status === 'FINAL')
    .reduce((sum, r) => sum + (r.total_amount ?? 0), 0)

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
      {isManager && (
        <Card className="border-border">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gesamtumsatz (finalisierte Tage)</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Kassenblätter</p>
                <p className="text-lg font-semibold">
                  {reports.filter((r) => r.status === 'FINAL').length} / {eventDays.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {eventDays.map((day) => {
          const report = reports.find((r) => r.event_day_id === day.id)
          return (
            <Card key={day.id} className="border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {day.day_label} — {formatDate(day.event_date)}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {report && (
                      <>
                        {report.signature_file_path && (
                          <span title="Unterschrift vorhanden"><CheckCircle className="h-4 w-4 text-green-400" /></span>
                        )}
                        {report.cash_photo_file_path && (
                          <span title="Foto vorhanden"><CheckCircle className="h-4 w-4 text-blue-400" /></span>
                        )}
                        <Badge
                          variant="outline"
                          className={`text-xs ${getStatusBadgeColor(report.status)}`}
                        >
                          {statusLabels[report.status] ?? report.status}
                        </Badge>
                      </>
                    )}
                    {!report && (
                      <Badge variant="outline" className="text-xs bg-muted text-muted-foreground border-border">
                        Kein Kassenblatt
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    {report ? (
                      <p className="text-lg font-semibold">
                        {formatCurrency(report.total_amount ?? 0)}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        Noch kein Kassenblatt erfasst
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/cash-reports/${eventId}/${day.id}`}>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-1" />
                        {report ? 'Öffnen' : 'Erstellen'}
                      </Button>
                    </Link>
                    {isManager && report?.status === 'FINAL' && (
                      <a href={`/api/cash-reports/${report.id}/export-pdf`} target="_blank">
                        <Button variant="outline" size="sm">
                          PDF
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {eventDays.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Keine Event-Tage vorhanden
          </p>
        )}
      </div>
    </div>
  )
}

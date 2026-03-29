'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Camera, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { DenominationTable, getDefaultDenominations } from '@/components/cash-reports/denomination-table'
import { SignatureCanvas } from '@/components/cash-reports/signature-canvas'
import { formatCurrency, getStatusBadgeColor } from '@/lib/utils'
import type { CashReport, DenominationRow } from '@/types'

export default function CashReportPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.eventId as string
  const dayId = params.dayId as string

  const [report, setReport] = useState<CashReport | null>(null)
  const [denominations, setDenominations] = useState<DenominationRow[]>(getDefaultDenominations())
  const [notes, setNotes] = useState('')
  const [signature, setSignature] = useState<string | null>(null)
  const [photo, setPhoto] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [eventDay, setEventDay] = useState<{ day_label: string; event_date: string } | null>(null)
  const photoRef = useRef<HTMLInputElement>(null)

  const loadReport = useCallback(async () => {
    const supabase = createClient()

    const [{ data: dayData }, { data: reportData }] = await Promise.all([
      supabase.from('event_days').select('day_label, event_date').eq('id', dayId).single(),
      supabase
        .from('cash_reports')
        .select('*, denominations:cash_report_denominations(*)')
        .eq('event_day_id', dayId)
        .single(),
    ])

    setEventDay(dayData)

    if (reportData) {
      setReport(reportData as CashReport)
      setNotes(reportData.notes ?? '')

      if (reportData.denominations && reportData.denominations.length > 0) {
        type DbDenom = { denomination_type: string; denomination_value: number; quantity: number; subtotal: number }
        const defaults = getDefaultDenominations()
        const merged = defaults.map((d) => {
          const found = (reportData.denominations as DbDenom[]).find(
            (r) => r.denomination_value === d.value && r.denomination_type === d.type
          )
          if (found) {
            return {
              ...d,
              quantity: found.quantity,
              subtotal: found.subtotal,
            }
          }
          return d
        })
        setDenominations(merged)
      }
    }

    setLoading(false)
  }, [dayId])

  useEffect(() => {
    loadReport()
  }, [loadReport])

  const grandTotal = denominations.reduce((sum, d) => sum + d.subtotal, 0)

  async function ensureReport(): Promise<string | null> {
    if (report) return report.id

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, tenant_id')
      .eq('user_id', user.id)
      .single()

    if (!profile) return null

    const { data, error } = await supabase
      .from('cash_reports')
      .insert({
        event_id: eventId,
        event_day_id: dayId,
        tenant_id: profile.tenant_id,
        status: 'OPEN',
        total_amount: 0,
      })
      .select()
      .single()

    if (error || !data) return null
    setReport(data as CashReport)
    return data.id
  }

  async function handleSaveDraft() {
    setSaving(true)
    try {
      const reportId = await ensureReport()
      if (!reportId) {
        toast.error('Fehler beim Erstellen des Kassenblatts')
        return
      }

      const supabase = createClient()

      // Update cash report
      await supabase
        .from('cash_reports')
        .update({ notes, total_amount: grandTotal })
        .eq('id', reportId)

      // Upsert denominations
      await supabase.from('cash_report_denominations').delete().eq('cash_report_id', reportId)
      await supabase.from('cash_report_denominations').insert(
        denominations
          .filter((d) => d.quantity > 0)
          .map((d) => ({
            cash_report_id: reportId,
            denomination_type: d.type,
            denomination_value: d.value,
            quantity: d.quantity,
            subtotal: d.subtotal,
          }))
      )

      toast.success('Entwurf gespeichert')
      await loadReport()
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit() {
    if (!signature) {
      toast.error('Bitte unterschreiben Sie das Kassenblatt')
      return
    }
    if (!photo && !report?.cash_photo_file_path) {
      toast.error('Bitte laden Sie ein Foto des Geldbestands hoch')
      return
    }

    setSaving(true)
    try {
      const reportId = await ensureReport()
      if (!reportId) return

      const supabase = createClient()
      let signaturePath = report?.signature_file_path
      let photoPath = report?.cash_photo_file_path

      // Upload signature
      if (signature) {
        const signatureBlob = await (await fetch(signature)).blob()
        const sigPath = `${reportId}/signature.png`
        await supabase.storage.from('cash-report-photos').upload(sigPath, signatureBlob, { upsert: true })
        signaturePath = sigPath
      }

      // Upload photo
      if (photo) {
        const photoFileName = `${reportId}/cash-photo.${photo.name.split('.').pop()}`
        await supabase.storage.from('cash-report-photos').upload(photoFileName, photo, { upsert: true })
        photoPath = photoFileName
      }

      // Upsert denominations
      await supabase.from('cash_report_denominations').delete().eq('cash_report_id', reportId)
      await supabase.from('cash_report_denominations').insert(
        denominations
          .filter((d) => d.quantity > 0)
          .map((d) => ({
            cash_report_id: reportId,
            denomination_type: d.type,
            denomination_value: d.value,
            quantity: d.quantity,
            subtotal: d.subtotal,
          }))
      )

      await supabase.from('cash_reports').update({
        status: 'SUBMITTED',
        total_amount: grandTotal,
        notes,
        signature_file_path: signaturePath,
        cash_photo_file_path: photoPath,
        submitted_at: new Date().toISOString(),
      }).eq('id', reportId)

      toast.success('Kassenblatt eingereicht')
      await loadReport()
    } finally {
      setSaving(false)
    }
  }

  const isReadOnly = report?.status === 'FINAL'
  const statusLabels: Record<string, string> = {
    OPEN: 'Offen',
    SUBMITTED: 'Eingereicht',
    FINAL: 'Final',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl mx-auto">
      <PageHeader
        title="Kassenblatt"
        breadcrumbs={[
          { label: 'Veranstaltungen', href: '/events' },
          { label: 'Kassenblatt' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {report && (
              <Badge variant="outline" className={getStatusBadgeColor(report.status)}>
                {statusLabels[report.status] ?? report.status}
              </Badge>
            )}
            {eventDay && (
              <span className="text-sm text-muted-foreground">
                {eventDay.day_label} — {new Date(eventDay.event_date).toLocaleDateString('de-DE')}
              </span>
            )}
          </div>
        }
      />

      {/* Denomination Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Stückelung</CardTitle>
        </CardHeader>
        <CardContent>
          <DenominationTable
            value={denominations}
            onChange={setDenominations}
            readOnly={isReadOnly}
          />
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Hinweise</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optionale Notizen..."
            rows={3}
            disabled={isReadOnly}
          />
        </CardContent>
      </Card>

      {/* Cash Photo */}
      {!isReadOnly && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Foto Geldbestand
              <span className="text-destructive text-sm">*</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Bitte fotografieren Sie den Geldbestand vor dem Einreichen.
            </p>
            <Button
              variant="outline"
              onClick={() => photoRef.current?.click()}
              className="w-full"
            >
              <Camera className="h-4 w-4 mr-2" />
              {photo ? photo.name : (report?.cash_photo_file_path ? 'Foto ersetzen' : 'Foto aufnehmen')}
            </Button>
            {report?.cash_photo_file_path && (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <CheckCircle className="h-4 w-4" />
                Foto vorhanden
              </div>
            )}
            <input
              ref={photoRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            />
          </CardContent>
        </Card>
      )}

      {/* Signature */}
      {!isReadOnly && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">
              Unterschrift <span className="text-destructive">*</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SignatureCanvas
              onSignature={setSignature}
              readOnly={isReadOnly}
              existingSignature={report?.signature_file_path ?? null}
            />
          </CardContent>
        </Card>
      )}

      {/* Total Summary */}
      <Card className="border-border">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <p className="text-lg font-medium">Gesamtbetrag</p>
            <p className="text-2xl font-bold tabular-nums">
              {formatCurrency(report?.status === 'FINAL' ? (report.total_amount ?? 0) : grandTotal)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {!isReadOnly && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={saving}
            className="flex-1"
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Entwurf speichern
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="flex-1" disabled={saving}>
                Einreichen
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Kassenblatt einreichen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Möchten Sie das Kassenblatt wirklich einreichen? Dies kann nicht rückgängig gemacht werden.
                  Gesamtbetrag: {formatCurrency(grandTotal)}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction onClick={handleSubmit}>
                  Einreichen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {isReadOnly && (
        <div className="flex items-center gap-2 text-green-400 justify-center">
          <CheckCircle className="h-5 w-5" />
          <p className="font-medium">Kassenblatt finalisiert</p>
        </div>
      )}
    </div>
  )
}

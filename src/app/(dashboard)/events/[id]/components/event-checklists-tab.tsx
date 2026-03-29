'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, CheckCircle, Circle, Loader2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDateTime } from '@/lib/utils'
import type { ChecklistRun, ChecklistTemplate } from '@/types'

interface EventChecklistsTabProps {
  eventId: string
  tenantId: string
  isManager: boolean
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  IN_PROGRESS: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  COMPLETED: 'bg-green-500/20 text-green-400 border-green-500/30',
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Offen',
  IN_PROGRESS: 'In Bearbeitung',
  COMPLETED: 'Abgeschlossen',
}

export function EventChecklistsTab({ eventId, tenantId, isManager }: EventChecklistsTabProps) {
  const [runs, setRuns] = useState<ChecklistRun[]>([])
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('none')
  const [creating, setCreating] = useState(false)

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const [{ data: runsData }, { data: templatesData }] = await Promise.all([
      supabase
        .from('event_checklist_runs')
        .select('*, template:checklist_templates(id, name, pdf_url), completer:profiles(full_name)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false }),
      supabase
        .from('checklist_templates')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('name'),
    ])
    setRuns((runsData as ChecklistRun[]) ?? [])
    setTemplates((templatesData as ChecklistTemplate[]) ?? [])
    setLoading(false)
  }, [eventId, tenantId])

  useEffect(() => { loadData() }, [loadData])

  async function handleCreateRun() {
    if (!selectedTemplate || selectedTemplate === 'none') return
    setCreating(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', user.id).single()
      const { error } = await supabase.from('event_checklist_runs').insert({
        event_id: eventId,
        tenant_id: tenantId,
        template_id: selectedTemplate,
        completed_by: profile?.id,
        status: 'OPEN',
      })
      if (error) { toast.error('Fehler beim Erstellen'); return }
      toast.success('Kontrollblatt hinzugefügt')
      setDialogOpen(false)
      setSelectedTemplate('none')
      await loadData()
    } finally { setCreating(false) }
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
        <CardTitle className="text-base">Kontrollblätter ({runs.length})</CardTitle>
        {isManager && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Kontrollblatt hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Kontrollblatt zur Veranstaltung hinzufügen</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {templates.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">Keine aktiven Vorlagen vorhanden.</p>
                    <Link href="/settings/checklists">
                      <Button variant="link" size="sm" className="mt-1">
                        Vorlagen in den Einstellungen erstellen →
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Vorlage auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Vorlage auswählen</SelectItem>
                        {templates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      className="w-full"
                      onClick={handleCreateRun}
                      disabled={!selectedTemplate || selectedTemplate === 'none' || creating}
                    >
                      {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Hinzufügen
                    </Button>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {runs.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">Keine Kontrollblätter für diese Veranstaltung.</p>
            {isManager && (
              <p className="text-xs text-muted-foreground mt-1">Klicke auf „Kontrollblatt hinzufügen" um zu starten.</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {runs.map((run) => {
              const template = run.template as unknown as { id: string; name: string; pdf_url?: string | null } | null
              const completer = run.completer as unknown as { full_name: string } | null
              return (
                <div key={run.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div className="flex items-center gap-3">
                    {run.status === 'COMPLETED'
                      ? <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                      : <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    }
                    <div>
                      <p className="text-sm font-medium">{template?.name ?? 'Unbekannte Vorlage'}</p>
                      <p className="text-xs text-muted-foreground">
                        {completer?.full_name ?? '—'}
                        {run.completed_at && ` · Abgeschlossen ${formatDateTime(run.completed_at)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${STATUS_COLORS[run.status] ?? ''}`}>
                      {STATUS_LABELS[run.status] ?? run.status}
                    </Badge>
                    {template?.pdf_url && (
                      <a href={template.pdf_url} target="_blank" rel="noreferrer">
                        <Button variant="ghost" size="sm" className="h-7 px-2">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                    )}
                    <Link href={`/events/${eventId}/checklists/${run.id}`}>
                      <Button variant="outline" size="sm" className="h-7">
                        {run.status === 'COMPLETED' ? 'Ansehen' : 'Ausfüllen'}
                      </Button>
                    </Link>
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

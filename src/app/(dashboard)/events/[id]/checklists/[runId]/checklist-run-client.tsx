'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Circle, FileText, ExternalLink, ChevronLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import type { ChecklistRun, ChecklistAnswer, ChecklistTemplateItem } from '@/types'

interface Props {
  run: ChecklistRun & {
    template: {
      id: string
      name: string
      description: string | null
      category: string
      pdf_url?: string | null
      items: ChecklistTemplateItem[]
    }
  }
  answers: ChecklistAnswer[]
  eventId: string
  eventTitle: string
  profileId: string
  language: string
}

export function ChecklistRunClient({ run, answers: initialAnswers, eventId, eventTitle, profileId, language }: Props) {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const a of initialAnswers) {
      if (a.template_item_id && a.value !== null) map[a.template_item_id] = a.value
    }
    return map
  })
  const [saving, setSaving] = useState(false)
  const [completing, setCompleting] = useState(false)
  const isCompleted = run.status === 'COMPLETED'

  const template = run.template
  const items = [...(template.items ?? [])].sort((a, b) => a.sort_order - b.sort_order)

  function getLabel(item: ChecklistTemplateItem) {
    if (language === 'en' && item.label_en) return item.label_en
    if (language === 'es' && item.label_es) return item.label_es
    return item.label
  }

  async function saveAnswer(itemId: string, value: string) {
    const updated = { ...answers, [itemId]: value }
    setAnswers(updated)

    const supabase = createClient()
    await supabase.from('event_checklist_answers').upsert({
      run_id: run.id,
      template_item_id: itemId,
      value,
    }, { onConflict: 'run_id,template_item_id' })

    // Update status to IN_PROGRESS if still OPEN
    if (run.status === 'OPEN') {
      await supabase.from('event_checklist_runs').update({ status: 'IN_PROGRESS' }).eq('id', run.id)
    }
  }

  async function handleComplete() {
    // Check required fields
    const missing = items.filter((item) => item.is_required && !answers[item.id]?.trim())
    if (missing.length > 0) {
      toast.error(`${missing.length} Pflichtfeld${missing.length > 1 ? 'er' : ''} fehlt noch`)
      return
    }

    setCompleting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('event_checklist_runs').update({
        status: 'COMPLETED',
        completed_by: profileId,
        completed_at: new Date().toISOString(),
      }).eq('id', run.id)

      if (error) { toast.error('Fehler beim Abschließen'); return }
      toast.success('Kontrollblatt abgeschlossen')
      router.push(`/events/${eventId}?tab=checklists`)
      router.refresh()
    } finally { setCompleting(false) }
  }

  const completedCount = items.filter((item) => answers[item.id]?.trim()).length
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title={template.name}
        breadcrumbs={[
          { label: eventTitle, href: `/events/${eventId}` },
          { label: 'Kontrollblätter', href: `/events/${eventId}` },
          { label: template.name },
        ]}
        actions={
          <Link href={`/events/${eventId}`}>
            <Button variant="outline" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Zurück
            </Button>
          </Link>
        }
      />

      {/* Status + Progress */}
      <Card className="border-border">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={
                isCompleted
                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                  : run.status === 'IN_PROGRESS'
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }>
                {isCompleted ? 'Abgeschlossen' : run.status === 'IN_PROGRESS' ? 'In Bearbeitung' : 'Offen'}
              </Badge>
              <span className="text-sm text-muted-foreground">{completedCount} / {items.length} ausgefüllt</span>
            </div>
            {template.pdf_url && (
              <a href={template.pdf_url} target="_blank" rel="noreferrer">
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-1" />
                  PDF <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </a>
            )}
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Checklist items */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Prüfpunkte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Prüfpunkte in dieser Vorlage.</p>
          ) : (
            items.map((item, idx) => {
              const value = answers[item.id] ?? ''
              const filled = value.trim().length > 0
              return (
                <div key={item.id} className="flex gap-3 py-3 border-b border-border last:border-0">
                  <div className="flex-shrink-0 mt-0.5">
                    {filled
                      ? <CheckCircle className="h-5 w-5 text-green-400" />
                      : <Circle className="h-5 w-5 text-muted-foreground" />
                    }
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Label className="text-sm font-medium">
                        {idx + 1}. {getLabel(item)}
                      </Label>
                      {item.is_required && (
                        <Badge variant="outline" className="text-xs bg-red-500/10 text-red-400 border-red-500/20">Pflicht</Badge>
                      )}
                    </div>

                    {item.item_type === 'CHECKBOX' && (
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={item.id}
                          checked={value === 'true'}
                          disabled={isCompleted}
                          onCheckedChange={(checked) => saveAnswer(item.id, checked ? 'true' : '')}
                        />
                        <label htmlFor={item.id} className="text-sm text-muted-foreground cursor-pointer">
                          {value === 'true' ? 'Geprüft ✓' : 'Noch nicht geprüft'}
                        </label>
                      </div>
                    )}

                    {item.item_type === 'TEXT' && (
                      <Textarea
                        placeholder="Eingabe..."
                        value={value}
                        disabled={isCompleted}
                        rows={2}
                        onChange={(e) => saveAnswer(item.id, e.target.value)}
                      />
                    )}

                    {item.item_type === 'NUMBER' && (
                      <Input
                        type="number"
                        placeholder="Wert eingeben"
                        value={value}
                        disabled={isCompleted}
                        className="w-40"
                        onChange={(e) => saveAnswer(item.id, e.target.value)}
                      />
                    )}

                    {item.item_type === 'DATE' && (
                      <Input
                        type="date"
                        value={value}
                        disabled={isCompleted}
                        className="w-48"
                        onChange={(e) => saveAnswer(item.id, e.target.value)}
                      />
                    )}
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Complete button */}
      {!isCompleted && (
        <div className="flex justify-end">
          <Button onClick={handleComplete} disabled={completing} size="lg">
            {completing
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Abschließen...</>
              : <><CheckCircle className="h-4 w-4 mr-2" />Kontrollblatt abschließen</>
            }
          </Button>
        </div>
      )}
    </div>
  )
}

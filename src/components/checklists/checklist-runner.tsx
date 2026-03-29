'use client'

import { useState } from 'react'
import { Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { SignatureCanvas } from '@/components/cash-reports/signature-canvas'
import type { ChecklistTemplateItem, ChecklistItemType } from '@/types'

interface ChecklistRunnerProps {
  runId: string
  templateName: string
  items: ChecklistTemplateItem[]
  language?: string
  onComplete?: () => void
}

interface AnswerMap {
  [templateItemId: string]: string
}

export function ChecklistRunner({
  runId,
  templateName,
  items,
  language = 'de',
  onComplete,
}: ChecklistRunnerProps) {
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [signature, setSignature] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState(false)

  function getLabel(item: ChecklistTemplateItem): string {
    if (language === 'en' && item.label_en) return item.label_en
    if (language === 'es' && item.label_es) return item.label_es
    return item.label
  }

  function setAnswer(itemId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [itemId]: value }))
  }

  const requiredItems = items.filter((i) => i.is_required)
  const answeredRequired = requiredItems.filter((i) => answers[i.id]?.trim()).length
  const progress = items.length > 0
    ? Math.round((Object.keys(answers).length / items.length) * 100)
    : 0

  async function handleComplete() {
    // Validate required fields
    const missingRequired = requiredItems.filter((i) => !answers[i.id]?.trim())
    if (missingRequired.length > 0) {
      toast.error(`Bitte alle Pflichtfelder ausfüllen (${missingRequired.length} fehlend)`)
      return
    }

    if (!signature) {
      toast.error('Bitte unterschreiben Sie die Checkliste')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()

      // Upload signature
      const signatureBlob = await (await fetch(signature)).blob()
      const sigPath = `checklists/${runId}/signature.png`
      await supabase.storage.from('checklist-signatures').upload(sigPath, signatureBlob, { upsert: true })

      // Save answers
      const answerInserts = Object.entries(answers).map(([itemId, value]) => ({
        run_id: runId,
        template_item_id: itemId,
        value,
      }))

      await supabase.from('event_checklist_answers').upsert(answerInserts, {
        onConflict: 'run_id,template_item_id',
      })

      // Update run status
      await supabase.from('event_checklist_runs').update({
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        signature_file_path: sigPath,
      }).eq('id', runId)

      setCompleted(true)
      toast.success('Checkliste abgeschlossen')
      onComplete?.()
    } catch {
      toast.error('Fehler beim Abschließen')
    } finally {
      setSaving(false)
    }
  }

  if (completed) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-green-400">
        <CheckCircle className="h-12 w-12" />
        <p className="text-lg font-medium">Checkliste abgeschlossen!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{templateName}</span>
          <span className="text-muted-foreground">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="space-y-4">
        {items
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((item) => (
            <div key={item.id} className="space-y-2">
              <Label className="flex items-start gap-1">
                {getLabel(item)}
                {item.is_required && <span className="text-destructive">*</span>}
              </Label>
              <ChecklistItemRenderer
                item={item}
                value={answers[item.id] ?? ''}
                onChange={(val) => setAnswer(item.id, val)}
              />
            </div>
          ))}
      </div>

      <div className="space-y-2">
        <Label>Unterschrift *</Label>
        <SignatureCanvas onSignature={setSignature} />
      </div>

      <Button
        onClick={handleComplete}
        disabled={saving || answeredRequired < requiredItems.length}
        className="w-full"
      >
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Checkliste abschließen
      </Button>
    </div>
  )
}

function ChecklistItemRenderer({
  item,
  value,
  onChange,
}: {
  item: ChecklistTemplateItem
  value: string
  onChange: (val: string) => void
}) {
  const type = item.item_type as ChecklistItemType

  switch (type) {
    case 'CHECKBOX':
      return (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={value === 'true'}
            onCheckedChange={(checked) => onChange(checked ? 'true' : '')}
          />
          <span className="text-sm text-muted-foreground">Ja / Bestätigt</span>
        </div>
      )

    case 'TEXT':
      return (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Antwort eingeben..."
          rows={2}
        />
      )

    case 'NUMBER':
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className="max-w-32"
        />
      )

    case 'DATE':
      return (
        <Input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )

    case 'PHOTO':
      return (
        <div className="space-y-2">
          <Input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onChange(file.name)
            }}
          />
          {value && <p className="text-xs text-green-400">Foto: {value}</p>}
        </div>
      )

    case 'SIGNATURE':
      return (
        <SignatureCanvas
          onSignature={(sig) => onChange(sig ?? '')}
          existingSignature={value || null}
        />
      )

    default:
      return (
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      )
  }
}

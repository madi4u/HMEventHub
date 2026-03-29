'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ChevronDown, ChevronRight, FileText, Upload, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useTranslation } from '@/i18n'
import type { ChecklistTemplate, ChecklistTemplateItem } from '@/types'

type TemplateWithItems = ChecklistTemplate & { items: ChecklistTemplateItem[] }

interface Props {
  templates: TemplateWithItems[]
  tenantId: string
}

const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: 'Allgemein',
  HYGIENE: 'Hygiene',
  VEHICLE: 'Fahrzeug',
  CLEANING: 'Reinigung',
  OTHER: 'Sonstige',
}

const ITEM_TYPE_LABELS: Record<string, string> = {
  CHECKBOX: 'Checkbox',
  TEXT: 'Freitext',
  NUMBER: 'Zahl',
  DATE: 'Datum',
}

export function ChecklistSettingsClient({ templates: initialTemplates, tenantId }: Props) {
  const router = useRouter()
  const { tenantName } = useTranslation()
  const [templates, setTemplates] = useState<TemplateWithItems[]>(initialTemplates)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // New template dialog
  const [newDialogOpen, setNewDialogOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newCategory, setNewCategory] = useState('GENERAL')
  const [creating, setCreating] = useState(false)

  // New item dialog
  const [itemDialogTemplate, setItemDialogTemplate] = useState<string | null>(null)
  const [itemLabel, setItemLabel] = useState('')
  const [itemLabelEn, setItemLabelEn] = useState('')
  const [itemType, setItemType] = useState('CHECKBOX')
  const [itemRequired, setItemRequired] = useState(false)
  const [addingItem, setAddingItem] = useState(false)

  // PDF upload
  const [uploadingPdf, setUploadingPdf] = useState<string | null>(null)

  async function handleCreateTemplate() {
    if (!newName.trim()) { toast.error('Name erforderlich'); return }
    setCreating(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('checklist_templates')
        .insert({ tenant_id: tenantId, name: newName.trim(), description: newDescription.trim() || null, category: newCategory, is_active: true })
        .select('*, items:checklist_template_items(*)')
        .single()
      if (error || !data) { toast.error('Fehler beim Erstellen'); return }
      setTemplates((prev) => [data as TemplateWithItems, ...prev])
      toast.success('Vorlage erstellt')
      setNewDialogOpen(false)
      setNewName(''); setNewDescription(''); setNewCategory('GENERAL')
    } finally { setCreating(false) }
  }

  async function handleDeleteTemplate(id: string) {
    if (!confirm('Vorlage wirklich löschen?')) return
    const supabase = createClient()
    await supabase.from('checklist_templates').delete().eq('id', id)
    setTemplates((prev) => prev.filter((t) => t.id !== id))
    toast.success('Vorlage gelöscht')
  }

  async function handleToggleActive(id: string, current: boolean) {
    const supabase = createClient()
    await supabase.from('checklist_templates').update({ is_active: !current }).eq('id', id)
    setTemplates((prev) => prev.map((t) => t.id === id ? { ...t, is_active: !current } : t))
  }

  async function handleAddItem(templateId: string) {
    if (!itemLabel.trim()) { toast.error('Bezeichnung erforderlich'); return }
    setAddingItem(true)
    try {
      const supabase = createClient()
      const currentTemplate = templates.find((t) => t.id === templateId)
      const sortOrder = (currentTemplate?.items?.length ?? 0)
      const { data, error } = await supabase
        .from('checklist_template_items')
        .insert({ template_id: templateId, label: itemLabel.trim(), label_en: itemLabelEn.trim() || null, item_type: itemType, is_required: itemRequired, sort_order: sortOrder })
        .select()
        .single()
      if (error || !data) { toast.error('Fehler beim Hinzufügen'); return }
      setTemplates((prev) => prev.map((t) =>
        t.id === templateId ? { ...t, items: [...(t.items ?? []), data as ChecklistTemplateItem] } : t
      ))
      toast.success('Punkt hinzugefügt')
      setItemDialogTemplate(null)
      setItemLabel(''); setItemLabelEn(''); setItemType('CHECKBOX'); setItemRequired(false)
    } finally { setAddingItem(false) }
  }

  async function handleDeleteItem(templateId: string, itemId: string) {
    const supabase = createClient()
    await supabase.from('checklist_template_items').delete().eq('id', itemId)
    setTemplates((prev) => prev.map((t) =>
      t.id === templateId ? { ...t, items: t.items.filter((i) => i.id !== itemId) } : t
    ))
  }

  async function handleUploadPdf(templateId: string, file: File) {
    setUploadingPdf(templateId)
    try {
      const supabase = createClient()
      const path = `${tenantId}/${templateId}/${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('checklist-pdfs')
        .upload(path, file, { upsert: true })
      if (uploadError) { toast.error('Upload fehlgeschlagen'); return }

      const { data: urlData } = supabase.storage.from('checklist-pdfs').getPublicUrl(path)
      await supabase.from('checklist_templates').update({ pdf_url: urlData.publicUrl }).eq('id', templateId)
      setTemplates((prev) => prev.map((t) =>
        t.id === templateId ? { ...t, pdf_url: urlData.publicUrl } : t
      ))
      toast.success('PDF hochgeladen')
      router.refresh()
    } finally { setUploadingPdf(null) }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Kontrollblätter"
        breadcrumbs={[
          { label: tenantName || 'EventHub', href: '/dashboard' },
          { label: 'Einstellungen', href: '/settings' },
          { label: 'Kontrollblätter' },
        ]}
        actions={
          <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" />Neue Vorlage</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Neue Kontrollblatt-Vorlage</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input placeholder="z.B. HACCP Tagescheck" value={newName} onChange={(e) => setNewName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Beschreibung</Label>
                  <Textarea placeholder="Optionale Beschreibung..." value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Kategorie</Label>
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setNewDialogOpen(false)}>Abbrechen</Button>
                  <Button onClick={handleCreateTemplate} disabled={creating}>
                    {creating ? 'Erstellen...' : 'Erstellen'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {templates.length === 0 ? (
        <Card className="border-border">
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Noch keine Vorlagen angelegt.</p>
            <p className="text-sm text-muted-foreground mt-1">Erstelle deine erste Vorlage mit „Neue Vorlage".</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <Card key={template.id} className="border-border">
              <CardHeader className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <button
                    className="flex items-center gap-2 flex-1 text-left"
                    onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}
                  >
                    {expandedId === template.id
                      ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    }
                    <span className="font-medium text-sm">{template.name}</span>
                    <Badge variant="outline" className="text-xs ml-1">{CATEGORY_LABELS[template.category] ?? template.category}</Badge>
                    <span className="text-xs text-muted-foreground">{template.items?.length ?? 0} Punkte</span>
                  </button>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{template.is_active ? 'Aktiv' : 'Inaktiv'}</span>
                      <Switch
                        checked={template.is_active}
                        onCheckedChange={() => handleToggleActive(template.id, template.is_active)}
                      />
                    </div>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteTemplate(template.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {expandedId === template.id && (
                <CardContent className="pt-0 pb-4 px-4 space-y-4">
                  {template.description && (
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  )}

                  {/* PDF Upload */}
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">PDF-Vorlage</p>
                      {template.pdf_url ? (
                        <a href={template.pdf_url} target="_blank" rel="noreferrer" className="text-xs text-primary flex items-center gap-1 mt-0.5 hover:underline">
                          PDF öffnen <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-0.5">Noch kein PDF hinterlegt</p>
                      )}
                    </div>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleUploadPdf(template.id, file)
                        }}
                      />
                      <Button variant="outline" size="sm" asChild disabled={uploadingPdf === template.id}>
                        <span>
                          <Upload className="h-3 w-3 mr-1" />
                          {uploadingPdf === template.id ? 'Lädt...' : template.pdf_url ? 'Ersetzen' : 'Hochladen'}
                        </span>
                      </Button>
                    </label>
                  </div>

                  {/* Items list */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Prüfpunkte</p>
                    {(template.items ?? []).length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">Noch keine Punkte — füge den ersten hinzu.</p>
                    ) : (
                      template.items.map((item, idx) => (
                        <div key={item.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-secondary/30">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-5">{idx + 1}.</span>
                            <span className="text-sm">{item.label}</span>
                            {item.label_en && <span className="text-xs text-muted-foreground">/ {item.label_en}</span>}
                            <Badge variant="outline" className="text-xs">{ITEM_TYPE_LABELS[item.item_type] ?? item.item_type}</Badge>
                            {item.is_required && <Badge variant="outline" className="text-xs bg-red-500/10 text-red-400 border-red-500/20">Pflicht</Badge>}
                          </div>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteItem(template.id, item.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add item */}
                  <Dialog open={itemDialogTemplate === template.id} onOpenChange={(v) => setItemDialogTemplate(v ? template.id : null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-3 w-3 mr-1" />Prüfpunkt hinzufügen
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Prüfpunkt hinzufügen</DialogTitle></DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Bezeichnung (DE) *</Label>
                          <Input placeholder="z.B. Temperatur geprüft" value={itemLabel} onChange={(e) => setItemLabel(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Bezeichnung (EN)</Label>
                          <Input placeholder="e.g. Temperature checked" value={itemLabelEn} onChange={(e) => setItemLabelEn(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Typ</Label>
                            <Select value={itemType} onValueChange={setItemType}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Object.entries(ITEM_TYPE_LABELS).map(([v, l]) => (
                                  <SelectItem key={v} value={v}>{l}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Pflichtfeld</Label>
                            <div className="flex items-center gap-2 pt-2">
                              <Switch checked={itemRequired} onCheckedChange={setItemRequired} />
                              <span className="text-sm text-muted-foreground">{itemRequired ? 'Ja' : 'Nein'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setItemDialogTemplate(null)}>Abbrechen</Button>
                          <Button onClick={() => handleAddItem(template.id)} disabled={addingItem}>
                            {addingItem ? 'Hinzufügen...' : 'Hinzufügen'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { redirect } from 'next/navigation'
import { Plus, Loader2, Save, Trash2, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import type { OnboardingModule } from '@/types'

export default function OnboardingManagePage() {
  const [modules, setModules] = useState<OnboardingModule[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingModule, setEditingModule] = useState<Partial<OnboardingModule> | null>(null)
  const [saving, setSaving] = useState(false)
  const [tenantId, setTenantId] = useState('')

  const loadModules = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, role')
      .eq('user_id', user.id)
      .single()

    if (!profile || !['SUPERADMIN', 'TENANT_ADMIN', 'OWNER', 'EVENT_MANAGER'].includes(profile.role)) {
      window.location.href = '/onboarding'
      return
    }

    setTenantId(profile.tenant_id ?? '')

    const { data } = await supabase
      .from('onboarding_modules')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('sort_order', { ascending: true })

    setModules((data as OnboardingModule[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadModules()
  }, [loadModules])

  function openNewModule() {
    setEditingModule({
      title_de: '',
      title_en: '',
      title_es: '',
      content_de: '',
      content_en: '',
      content_es: '',
      sort_order: modules.length,
      is_active: true,
    })
    setDialogOpen(true)
  }

  function openEditModule(mod: OnboardingModule) {
    setEditingModule({ ...mod })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!editingModule?.title_de?.trim()) {
      toast.error('Deutscher Titel ist erforderlich')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()

      if (editingModule.id) {
        await supabase
          .from('onboarding_modules')
          .update({
            title_de: editingModule.title_de,
            title_en: editingModule.title_en || null,
            title_es: editingModule.title_es || null,
            content_de: editingModule.content_de || null,
            content_en: editingModule.content_en || null,
            content_es: editingModule.content_es || null,
            sort_order: editingModule.sort_order ?? 0,
            is_active: editingModule.is_active ?? true,
          })
          .eq('id', editingModule.id)
      } else {
        await supabase.from('onboarding_modules').insert({
          tenant_id: tenantId,
          title_de: editingModule.title_de!,
          title_en: editingModule.title_en || null,
          title_es: editingModule.title_es || null,
          content_de: editingModule.content_de || null,
          content_en: editingModule.content_en || null,
          content_es: editingModule.content_es || null,
          sort_order: editingModule.sort_order ?? modules.length,
          is_active: editingModule.is_active ?? true,
        })
      }

      toast.success('Modul gespeichert')
      setDialogOpen(false)
      await loadModules()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('onboarding_modules').delete().eq('id', id)
    toast.success('Modul gelöscht')
    await loadModules()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Onboarding verwalten"
        breadcrumbs={[
          { label: 'Onboarding', href: '/onboarding' },
          { label: 'Verwalten' },
        ]}
        actions={
          <Button size="sm" onClick={openNewModule}>
            <Plus className="h-4 w-4 mr-1" />
            Neues Modul
          </Button>
        }
      />

      <div className="space-y-3">
        {modules.length === 0 ? (
          <Card className="border-border">
            <CardContent className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Keine Module vorhanden</p>
            </CardContent>
          </Card>
        ) : (
          modules.map((mod) => (
            <Card key={mod.id} className="border-border">
              <CardContent className="flex items-center gap-3 py-4">
                <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{mod.title_de}</p>
                  {mod.title_en && (
                    <p className="text-xs text-muted-foreground">{mod.title_en}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${mod.is_active ? 'text-green-400' : 'text-muted-foreground'}`}>
                    {mod.is_active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => openEditModule(mod)}>
                    Bearbeiten
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive h-8 w-8 p-0"
                    onClick={() => handleDelete(mod.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingModule?.id ? 'Modul bearbeiten' : 'Neues Modul'}</DialogTitle>
          </DialogHeader>
          {editingModule && (
            <div className="space-y-4">
              <Tabs defaultValue="de">
                <TabsList>
                  <TabsTrigger value="de">🇩🇪 Deutsch</TabsTrigger>
                  <TabsTrigger value="en">🇬🇧 Englisch</TabsTrigger>
                  <TabsTrigger value="es">🇪🇸 Spanisch</TabsTrigger>
                </TabsList>
                <TabsContent value="de" className="space-y-3">
                  <div className="space-y-2">
                    <Label>Titel (DE) *</Label>
                    <Input
                      value={editingModule.title_de ?? ''}
                      onChange={(e) => setEditingModule((m) => m ? { ...m, title_de: e.target.value } : m)}
                      placeholder="Modultitel auf Deutsch"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Inhalt (DE)</Label>
                    <Textarea
                      value={editingModule.content_de ?? ''}
                      onChange={(e) => setEditingModule((m) => m ? { ...m, content_de: e.target.value } : m)}
                      rows={8}
                      placeholder="Modulinhalt auf Deutsch..."
                    />
                  </div>
                </TabsContent>
                <TabsContent value="en" className="space-y-3">
                  <div className="space-y-2">
                    <Label>Titel (EN)</Label>
                    <Input
                      value={editingModule.title_en ?? ''}
                      onChange={(e) => setEditingModule((m) => m ? { ...m, title_en: e.target.value } : m)}
                      placeholder="Module title in English"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Inhalt (EN)</Label>
                    <Textarea
                      value={editingModule.content_en ?? ''}
                      onChange={(e) => setEditingModule((m) => m ? { ...m, content_en: e.target.value } : m)}
                      rows={8}
                      placeholder="Module content in English..."
                    />
                  </div>
                </TabsContent>
                <TabsContent value="es" className="space-y-3">
                  <div className="space-y-2">
                    <Label>Título (ES)</Label>
                    <Input
                      value={editingModule.title_es ?? ''}
                      onChange={(e) => setEditingModule((m) => m ? { ...m, title_es: e.target.value } : m)}
                      placeholder="Título del módulo en español"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contenido (ES)</Label>
                    <Textarea
                      value={editingModule.content_es ?? ''}
                      onChange={(e) => setEditingModule((m) => m ? { ...m, content_es: e.target.value } : m)}
                      rows={8}
                      placeholder="Contenido del módulo en español..."
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Reihenfolge</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editingModule.sort_order ?? 0}
                    onChange={(e) => setEditingModule((m) => m ? { ...m, sort_order: Number(e.target.value) } : m)}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    checked={editingModule.is_active ?? true}
                    onCheckedChange={(checked) => setEditingModule((m) => m ? { ...m, is_active: checked } : m)}
                  />
                  <Label>Aktiv</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-1" />
                  Speichern
                </Button>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Abbrechen
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

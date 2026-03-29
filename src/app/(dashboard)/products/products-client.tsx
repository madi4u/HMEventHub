'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ShoppingBag, Loader2, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useTranslation } from '@/i18n'
import type { Product, ProductCategory } from '@/types'

type ProductWithCategory = Product & { category: { name: string } | null }

interface Props {
  products: ProductWithCategory[]
  categories: ProductCategory[]
  tenantId: string
}

const EMPTY_FORM = { name: '', category_id: 'none', unit: '', notes: '', is_active: true }

export function ProductsClient({ products: initialProducts, categories: initialCategories, tenantId }: Props) {
  const { t, tenantName } = useTranslation()
  const router = useRouter()

  const [products, setProducts] = useState(initialProducts)
  const [categories, setCategories] = useState(initialCategories)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<ProductWithCategory | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // Inline category creation
  const [newCatName, setNewCatName] = useState('')
  const [addingCat, setAddingCat] = useState(false)
  const [savingCat, setSavingCat] = useState(false)

  const openCreate = () => {
    setEditProduct(null)
    setForm(EMPTY_FORM)
    setDialogOpen(true)
  }

  const openEdit = (p: ProductWithCategory) => {
    setEditProduct(p)
    setForm({
      name: p.name,
      category_id: p.category_id ?? 'none',
      unit: p.unit,
      notes: p.notes ?? '',
      is_active: p.is_active,
    })
    setDialogOpen(true)
  }

  const reload = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('products')
      .select('*, category:product_categories(name)')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true })
    if (data) setProducts(data as ProductWithCategory[])
  }, [tenantId])

  async function handleSaveCategory() {
    if (!newCatName.trim()) return
    setSavingCat(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('product_categories')
        .insert({ name: newCatName.trim(), tenant_id: tenantId, sort_order: categories.length })
        .select()
        .single()
      if (error) { toast.error('Fehler beim Anlegen'); return }
      const newCat = data as ProductCategory
      setCategories((prev) => [...prev, newCat])
      setForm((f) => ({ ...f, category_id: newCat.id }))
      setNewCatName('')
      setAddingCat(false)
      toast.success('Kategorie angelegt')
    } finally {
      setSavingCat(false)
    }
  }

  async function handleSave() {
    if (!form.name.trim() || !form.unit.trim()) {
      toast.error('Name und Einheit sind Pflichtfelder')
      return
    }
    setSaving(true)
    try {
      const supabase = createClient()
      const payload = {
        name: form.name.trim(),
        category_id: form.category_id === 'none' ? null : form.category_id,
        unit: form.unit.trim(),
        notes: form.notes.trim() || null,
        is_active: form.is_active,
        tenant_id: tenantId,
      }

      if (editProduct) {
        const { error } = await supabase.from('products').update(payload).eq('id', editProduct.id)
        if (error) { toast.error('Fehler beim Speichern'); return }
        toast.success('Produkt aktualisiert')
      } else {
        const { error } = await supabase.from('products').insert(payload)
        if (error) { toast.error('Fehler beim Anlegen'); return }
        toast.success('Produkt angelegt')
      }

      setDialogOpen(false)
      await reload()
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t('products.title')}
        breadcrumbs={[
          { label: tenantName || 'EventHub', href: '/dashboard' },
          { label: t('products.title') },
        ]}
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            {t('products.newProduct')}
          </Button>
        }
      />

      <Card className="border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>{t('common.name')}</TableHead>
                <TableHead>{t('products.category')}</TableHead>
                <TableHead>{t('products.unit')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ShoppingBag className="h-8 w-8 opacity-50" />
                      <p className="text-sm">{t('products.noProducts')}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id} className="border-border">
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {product.category?.name ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{product.unit}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={product.is_active
                          ? 'bg-green-500/20 text-green-400 border-green-500/30 text-xs'
                          : 'bg-muted text-muted-foreground border-border text-xs'
                        }
                      >
                        {product.is_active ? t('common.active') : t('common.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(product)}>
                        {t('common.edit')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editProduct ? 'Produkt bearbeiten' : 'Neues Produkt'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name <span className="text-red-400">*</span></Label>
              <Input
                placeholder="z. B. Currywurst"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Kategorie</Label>
              <Select value={form.category_id} onValueChange={(v) => {
                if (v === '__new__') { setAddingCat(true); return }
                setForm({ ...form, category_id: v })
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Keine Kategorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Keine Kategorie</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                  <SelectItem value="__new__" className="text-primary font-medium">
                    <span className="flex items-center gap-1.5">
                      <Plus className="h-3.5 w-3.5" />
                      Neue Kategorie anlegen…
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>

              {addingCat && (
                <div className="flex gap-2 mt-1">
                  <Input
                    autoFocus
                    placeholder="Kategoriename"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveCategory()
                      if (e.key === 'Escape') { setAddingCat(false); setNewCatName('') }
                    }}
                  />
                  <Button size="icon" variant="outline" onClick={handleSaveCategory} disabled={savingCat || !newCatName.trim()}>
                    {savingCat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => { setAddingCat(false); setNewCatName('') }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Einheit <span className="text-red-400">*</span></Label>
              <Input
                placeholder="z. B. Stück, kg, Liter"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Notizen</Label>
              <Textarea
                placeholder="Optionale Hinweise..."
                value={form.notes}
                rows={2}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
              <Label>Aktiv</Label>
            </div>

            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editProduct ? 'Speichern' : 'Anlegen'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

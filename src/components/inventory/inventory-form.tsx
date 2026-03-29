'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Camera, Plus, Minus } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import type { Product, EventDay, InventorySessionType } from '@/types'

interface InventoryFormProps {
  eventId: string
  eventDays: EventDay[]
  products: Product[]
  tenantId: string
  onSuccess?: () => void
}

interface ItemEntry {
  product_id: string
  quantity: number
}

export function InventoryForm({ eventId, eventDays, products, tenantId, onSuccess }: InventoryFormProps) {
  const router = useRouter()
  const [sessionType, setSessionType] = useState<InventorySessionType>('INTAKE')
  const [dayId, setDayId] = useState('none')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<ItemEntry[]>([])
  const [photo, setPhoto] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function addProduct(productId: string) {
    if (items.some((i) => i.product_id === productId)) return
    setItems((prev) => [...prev, { product_id: productId, quantity: 0 }])
  }

  function updateQuantity(productId: string, quantity: number) {
    setItems((prev) =>
      prev.map((i) => (i.product_id === productId ? { ...i, quantity: Math.max(0, quantity) } : i))
    )
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.product_id !== productId))
  }

  async function handleSubmit() {
    if (!photo) {
      toast.error('Bitte ein Foto hochladen')
      return
    }
    if (items.length === 0) {
      toast.error('Bitte mindestens einen Artikel hinzufügen')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      // Upload photo
      const fileName = `${Date.now()}_inventory.${photo.name.split('.').pop()}`
      const photoPath = `inventory/${eventId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('inventory-photos')
        .upload(photoPath, photo)

      if (uploadError) {
        toast.error('Fehler beim Hochladen des Fotos')
        return
      }

      // Create session
      const { data: session, error } = await supabase
        .from('event_inventory_sessions')
        .insert({
          event_id: eventId,
          tenant_id: tenantId,
          event_day_id: dayId === 'none' ? null : dayId,
          session_type: sessionType,
          photo_url: photoPath,
          notes: notes || null,
          created_by: profile?.id,
        })
        .select()
        .single()

      if (error || !session) {
        toast.error('Fehler beim Erstellen der Session')
        return
      }

      // Insert items
      await supabase.from('event_inventory_items').insert(
        items.map((item) => ({
          session_id: session.id,
          product_id: item.product_id,
          quantity: item.quantity,
        }))
      )

      toast.success('Inventur gespeichert')
      onSuccess?.()
      router.push(`/events/${eventId}?tab=inventory`)
    } catch {
      toast.error('Unerwarteter Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Session-Typ</Label>
          <Select value={sessionType} onValueChange={(v) => setSessionType(v as InventorySessionType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INTAKE">Eingang</SelectItem>
              <SelectItem value="RETURN">Rückgabe</SelectItem>
              <SelectItem value="COUNT">Zählung</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {eventDays.length > 0 && (
          <div className="space-y-2">
            <Label>Tag (optional)</Label>
            <Select value={dayId} onValueChange={setDayId}>
              <SelectTrigger>
                <SelectValue placeholder="Tag auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein Tag</SelectItem>
                {eventDays.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.day_label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Photo Upload - required */}
      <div className="space-y-2">
        <Label>
          Foto <span className="text-destructive">*</span>
          <span className="text-xs text-muted-foreground ml-2">(Pflicht)</span>
        </Label>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          className="w-full"
        >
          <Camera className="h-4 w-4 mr-2" />
          {photo ? photo.name : 'Foto aufnehmen / hochladen'}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
        />
      </div>

      {/* Product Selection */}
      <div className="space-y-2">
        <Label>Produkt hinzufügen</Label>
        <Select onValueChange={addProduct}>
          <SelectTrigger>
            <SelectValue placeholder="Produkt wählen" />
          </SelectTrigger>
          <SelectContent>
            {products
              .filter((p) => !items.some((i) => i.product_id === p.id))
              .map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} ({p.unit})
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Items List */}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => {
            const product = products.find((p) => p.id === item.product_id)
            if (!product) return null
            return (
              <Card key={item.product_id} className="border-border">
                <CardContent className="flex items-center gap-3 py-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.unit}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.product_id, Number(e.target.value))}
                      className="w-20 h-7 text-center text-sm"
                      min={0}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive"
                      onClick={() => removeItem(item.product_id)}
                    >
                      ×
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <div className="space-y-2">
        <Label>Notizen</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optionale Anmerkungen..."
          rows={2}
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={loading || !photo || items.length === 0}
        className="w-full"
      >
        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Inventur speichern
      </Button>
    </div>
  )
}

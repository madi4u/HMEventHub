'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

type LogisticsType = 'vehicles' | 'foodtrucks' | 'cooling_trailers' | 'equipment'

const TITLES: Record<LogisticsType, string> = {
  vehicles: 'Fahrzeug hinzufügen',
  foodtrucks: 'Foodtruck hinzufügen',
  cooling_trailers: 'Kühlwagen hinzufügen',
  equipment: 'Equipment hinzufügen',
}

interface Props {
  type: LogisticsType
  tenantId: string
}

export function AddLogisticsDialog({ type, tenantId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [licensePlate, setLicensePlate] = useState('')
  const [vehicleType, setVehicleType] = useState('VAN')
  const [foodtruckType, setFoodtruckType] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('ACTIVE')
  const [notes, setNotes] = useState('')

  function reset() {
    setName('')
    setLicensePlate('')
    setVehicleType('VAN')
    setFoodtruckType('')
    setCategory('')
    setStatus('ACTIVE')
    setNotes('')
  }

  async function handleSubmit() {
    if (!name.trim()) {
      toast.error('Name ist erforderlich')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      let payload: Record<string, string | null> = {
        tenant_id: tenantId,
        name: name.trim(),
        status,
        notes: notes.trim() || null,
      }
      if (type === 'vehicles') {
        payload = { ...payload, license_plate: licensePlate.trim() || null, type: vehicleType }
      } else if (type === 'foodtrucks') {
        payload = { ...payload, type: foodtruckType.trim() || null }
      } else if (type === 'equipment') {
        payload = { ...payload, category: category.trim() || null }
      }

      const { error } = await supabase.from(type).insert(payload)
      if (error) {
        toast.error('Fehler beim Speichern')
        return
      }
      toast.success('Erfolgreich hinzugefügt')
      setOpen(false)
      reset()
      router.refresh()
    } catch {
      toast.error('Unerwarteter Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Neu
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{TITLES[type]}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input
              placeholder={type === 'vehicles' ? 'z.B. Sprinter 1' : type === 'foodtrucks' ? 'z.B. Foodtruck Alpha' : 'Name'}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {type === 'vehicles' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kennzeichen</Label>
                  <Input placeholder="HB-XX 1234" value={licensePlate} onChange={(e) => setLicensePlate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Typ</Label>
                  <Select value={vehicleType} onValueChange={setVehicleType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VAN">Van</SelectItem>
                      <SelectItem value="LKW">LKW</SelectItem>
                      <SelectItem value="PKW">PKW</SelectItem>
                      <SelectItem value="TRANSPORTER">Transporter</SelectItem>
                      <SelectItem value="ANHÄNGER">Anhänger</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {type === 'foodtrucks' && (
            <div className="space-y-2">
              <Label>Typ</Label>
              <Input placeholder="z.B. Burger, Pizza, ..." value={foodtruckType} onChange={(e) => setFoodtruckType(e.target.value)} />
            </div>
          )}

          {type === 'equipment' && (
            <div className="space-y-2">
              <Label>Kategorie</Label>
              <Input placeholder="z.B. Zelt, Strom, Mobiliar" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
          )}

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Aktiv</SelectItem>
                <SelectItem value="INACTIVE">Inaktiv</SelectItem>
                <SelectItem value="IN_REPAIR">In Reparatur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notizen</Label>
            <Textarea placeholder="Optionale Anmerkungen..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Speichern...' : 'Hinzufügen'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

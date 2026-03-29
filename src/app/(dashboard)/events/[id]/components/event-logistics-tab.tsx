'use client'

import { useEffect, useState, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Vehicle, Foodtruck, EventLogisticsAssignment } from '@/types'

interface EventLogisticsTabProps {
  eventId: string
  tenantId: string
  isManager: boolean
}

export function EventLogisticsTab({ eventId, tenantId, isManager }: EventLogisticsTabProps) {
  const [logistics, setLogistics] = useState<EventLogisticsAssignment | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [foodtrucks, setFoodtrucks] = useState<Foodtruck[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)

  const [vehicleId, setVehicleId] = useState<string>('')
  const [foodtruckId, setFoodtruckId] = useState<string>('')
  const [equipmentNotes, setEquipmentNotes] = useState('')

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const [
      { data: logisticsData },
      { data: vehiclesData },
      { data: foodtrucksData },
    ] = await Promise.all([
      supabase
        .from('event_logistics_assignments')
        .select('*, vehicle:vehicles(*), foodtruck:foodtrucks(*)')
        .eq('event_id', eventId)
        .single(),
      supabase.from('vehicles').select('*').eq('tenant_id', tenantId).eq('status', 'ACTIVE'),
      supabase.from('foodtrucks').select('*').eq('tenant_id', tenantId),
    ])

    setLogistics(logisticsData as EventLogisticsAssignment | null)
    setVehicles((vehiclesData as Vehicle[]) ?? [])
    setFoodtrucks((foodtrucksData as Foodtruck[]) ?? [])

    if (logisticsData) {
      setVehicleId(logisticsData.vehicle_id ?? '')
      setFoodtruckId(logisticsData.foodtruck_id ?? '')
      setEquipmentNotes(logisticsData.equipment_notes ?? '')
    }

    setLoading(false)
  }, [eventId, tenantId])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleSave() {
    setSaving(true)
    try {
      const supabase = createClient()
      const payload = {
        event_id: eventId,
        tenant_id: tenantId,
        vehicle_id: vehicleId || null,
        foodtruck_id: foodtruckId || null,
        equipment_notes: equipmentNotes || null,
      }

      if (logistics) {
        await supabase
          .from('event_logistics_assignments')
          .update(payload)
          .eq('id', logistics.id)
      } else {
        await supabase.from('event_logistics_assignments').insert(payload)
      }

      toast.success('Logistik gespeichert')
      setEditing(false)
      await loadData()
    } catch {
      toast.error('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
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

  const vehicle = vehicles.find((v) => v.id === vehicleId)
  const foodtruck = foodtrucks.find((f) => f.id === foodtruckId)

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Logistik</CardTitle>
        {isManager && !editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Bearbeiten
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {editing ? (
          <>
            <div className="space-y-2">
              <Label>Fahrzeug</Label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Kein Fahrzeug" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Kein Fahrzeug</SelectItem>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name} {v.license_plate ? `(${v.license_plate})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Foodtruck</Label>
              <Select value={foodtruckId} onValueChange={setFoodtruckId}>
                <SelectTrigger>
                  <SelectValue placeholder="Kein Foodtruck" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Kein Foodtruck</SelectItem>
                  {foodtrucks.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Equipment-Hinweise</Label>
              <Textarea
                value={equipmentNotes}
                onChange={(e) => setEquipmentNotes(e.target.value)}
                placeholder="Zusätzliche Ausrüstung, Hinweise..."
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Speichern
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Abbrechen
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fahrzeug</p>
              <p className="text-sm mt-1">
                {vehicle
                  ? `${vehicle.name}${vehicle.license_plate ? ` (${vehicle.license_plate})` : ''}`
                  : 'Kein Fahrzeug zugewiesen'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Foodtruck</p>
              <p className="text-sm mt-1">{foodtruck ? foodtruck.name : 'Kein Foodtruck zugewiesen'}</p>
            </div>
            {logistics?.equipment_notes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Equipment-Hinweise</p>
                <p className="text-sm mt-1 text-muted-foreground whitespace-pre-wrap">
                  {logistics.equipment_notes}
                </p>
              </div>
            )}
            {!logistics && (
              <p className="text-sm text-muted-foreground">Keine Logistik zugewiesen</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

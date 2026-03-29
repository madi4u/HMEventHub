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
import type { Vehicle, Foodtruck, CoolingTrailer, Equipment, EventLogisticsAssignment } from '@/types'

interface EventLogisticsTabProps {
  eventId: string
  tenantId: string
  isManager: boolean
}

export function EventLogisticsTab({ eventId, tenantId, isManager }: EventLogisticsTabProps) {
  const [logistics, setLogistics] = useState<EventLogisticsAssignment | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [foodtrucks, setFoodtrucks] = useState<Foodtruck[]>([])
  const [coolingTrailers, setCoolingTrailers] = useState<CoolingTrailer[]>([])
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)

  const [vehicleId, setVehicleId] = useState<string>('none')
  const [foodtruckId, setFoodtruckId] = useState<string>('none')
  const [coolingTrailerId, setCoolingTrailerId] = useState<string>('none')
  const [equipmentId, setEquipmentId] = useState<string>('none')
  const [notes, setNotes] = useState('')

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const [
      { data: logisticsData },
      { data: vehiclesData },
      { data: foodtrucksData },
      { data: coolingData },
      { data: equipData },
    ] = await Promise.all([
      supabase
        .from('event_logistics_assignments')
        .select('*, vehicle:vehicles(*), foodtruck:foodtrucks(*), cooling_trailer:cooling_trailers(*), equipment:equipment(*)')
        .eq('event_id', eventId)
        .single(),
      supabase.from('vehicles').select('*').eq('tenant_id', tenantId).eq('status', 'ACTIVE').order('name'),
      supabase.from('foodtrucks').select('*').eq('tenant_id', tenantId).eq('status', 'ACTIVE').order('name'),
      supabase.from('cooling_trailers').select('*').eq('tenant_id', tenantId).eq('status', 'ACTIVE').order('name'),
      supabase.from('equipment').select('*').eq('tenant_id', tenantId).eq('status', 'ACTIVE').order('name'),
    ])

    setLogistics(logisticsData as EventLogisticsAssignment | null)
    setVehicles((vehiclesData as Vehicle[]) ?? [])
    setFoodtrucks((foodtrucksData as Foodtruck[]) ?? [])
    setCoolingTrailers((coolingData as CoolingTrailer[]) ?? [])
    setEquipmentList((equipData as Equipment[]) ?? [])

    if (logisticsData) {
      setVehicleId(logisticsData.vehicle_id ?? 'none')
      setFoodtruckId(logisticsData.foodtruck_id ?? 'none')
      setCoolingTrailerId(logisticsData.cooling_trailer_id ?? 'none')
      setEquipmentId(logisticsData.equipment_id ?? 'none')
      setNotes(logisticsData.equipment_notes ?? '')
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
        vehicle_id: vehicleId === 'none' ? null : vehicleId,
        foodtruck_id: foodtruckId === 'none' ? null : foodtruckId,
        cooling_trailer_id: coolingTrailerId === 'none' ? null : coolingTrailerId,
        equipment_id: equipmentId === 'none' ? null : equipmentId,
        equipment_notes: notes.trim() || null,
      }

      if (logistics) {
        await supabase.from('event_logistics_assignments').update(payload).eq('id', logistics.id)
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

  const assignedVehicle = vehicleId !== 'none' ? vehicles.find((v) => v.id === vehicleId) : undefined
  const assignedFoodtruck = foodtruckId !== 'none' ? foodtrucks.find((f) => f.id === foodtruckId) : undefined
  const assignedCooling = coolingTrailerId !== 'none' ? coolingTrailers.find((c) => c.id === coolingTrailerId) : undefined
  const assignedEquipment = equipmentId !== 'none' ? equipmentList.find((e) => e.id === equipmentId) : undefined

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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fahrzeug</Label>
                <Select value={vehicleId} onValueChange={setVehicleId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kein Fahrzeug" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Kein Fahrzeug</SelectItem>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}{v.license_plate ? ` (${v.license_plate})` : ''}
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
                    <SelectItem value="none">— Kein Foodtruck</SelectItem>
                    {foodtrucks.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}{f.license_plate ? ` (${f.license_plate})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Kühlwagen</Label>
                <Select value={coolingTrailerId} onValueChange={setCoolingTrailerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kein Kühlwagen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Kein Kühlwagen</SelectItem>
                    {coolingTrailers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}{c.license_plate ? ` (${c.license_plate})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Equipment</Label>
                <Select value={equipmentId} onValueChange={setEquipmentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kein Equipment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Kein Equipment</SelectItem>
                    {equipmentList.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}{e.category ? ` (${e.category})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notizen</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Zusätzliche Hinweise zur Logistik..."
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fahrzeug</p>
              <p className="text-sm mt-1">
                {assignedVehicle
                  ? `${assignedVehicle.name}${assignedVehicle.license_plate ? ` (${assignedVehicle.license_plate})` : ''}`
                  : <span className="text-muted-foreground">—</span>}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Foodtruck</p>
              <p className="text-sm mt-1">
                {assignedFoodtruck
                  ? `${assignedFoodtruck.name}${assignedFoodtruck.license_plate ? ` (${assignedFoodtruck.license_plate})` : ''}`
                  : <span className="text-muted-foreground">—</span>}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Kühlwagen</p>
              <p className="text-sm mt-1">
                {assignedCooling
                  ? `${assignedCooling.name}${assignedCooling.license_plate ? ` (${assignedCooling.license_plate})` : ''}`
                  : <span className="text-muted-foreground">—</span>}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Equipment</p>
              <p className="text-sm mt-1">
                {assignedEquipment
                  ? `${assignedEquipment.name}${assignedEquipment.category ? ` (${assignedEquipment.category})` : ''}`
                  : <span className="text-muted-foreground">—</span>}
              </p>
            </div>
            {logistics?.equipment_notes && (
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Notizen</p>
                <p className="text-sm mt-1 text-muted-foreground whitespace-pre-wrap">{logistics.equipment_notes}</p>
              </div>
            )}
            {!logistics && (
              <p className="col-span-2 text-sm text-muted-foreground">Keine Logistik zugewiesen</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

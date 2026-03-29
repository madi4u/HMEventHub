'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { generateDateRange } from '@/lib/utils'

const eventSchema = z.object({
  title: z.string().min(2, 'Mindestens 2 Zeichen erforderlich'),
  event_type: z.enum(['FESTIVAL', 'CORPORATE', 'PRIVATE', 'MARKET', 'CATERING', 'OTHER']),
  start_date: z.string().min(1, 'Startdatum erforderlich'),
  end_date: z.string().min(1, 'Enddatum erforderlich'),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  departure_time: z.string().optional(),
  status: z.enum(['DRAFT', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED']),
  address: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().optional(),
  google_maps_url: z.string().url().optional().or(z.literal('')),
  apple_maps_url: z.string().url().optional().or(z.literal('')),
  organizer_name: z.string().optional(),
  organizer_contact: z.string().optional(),
  stand_contact_name: z.string().optional(),
  stand_contact_phone: z.string().optional(),
  stand_number: z.string().optional(),
  emergency_phone: z.string().optional(),
  internal_notes: z.string().optional(),
})

type EventFormData = z.infer<typeof eventSchema>

const STEPS = ['Grunddaten', 'Ort & Kontakt', 'Team & Logistik', 'Hinweise']

export default function NewEventPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      event_type: 'FESTIVAL',
      status: 'DRAFT',
      country: 'DE',
    },
  })

  async function nextStep() {
    const fieldsPerStep: (keyof EventFormData)[][] = [
      ['title', 'event_type', 'start_date', 'end_date', 'status'],
      ['address', 'city', 'postal_code'],
      [],
      [],
    ]
    const valid = await trigger(fieldsPerStep[step])
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  async function onSubmit(data: EventFormData) {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, tenant_id')
        .eq('user_id', user.id)
        .single()

      if (!profile?.tenant_id) {
        toast.error('Kein Mandant zugewiesen')
        return
      }

      // Create event
      const { data: newEvent, error } = await supabase
        .from('events')
        .insert({
          ...data,
          tenant_id: profile.tenant_id,
          created_by: profile.id,
          google_maps_url: data.google_maps_url || null,
          apple_maps_url: data.apple_maps_url || null,
        })
        .select()
        .single()

      if (error || !newEvent) {
        toast.error('Fehler beim Erstellen der Veranstaltung')
        return
      }

      // Create event days
      const dates = generateDateRange(data.start_date, data.end_date)
      const eventDays = dates.map((date, index) => ({
        tenant_id: profile.tenant_id,
        event_id: newEvent.id,
        event_date: date,
        day_label: `Tag ${index + 1}`,
        status: 'OPEN' as const,
      }))

      await supabase.from('event_days').insert(eventDays)

      toast.success('Veranstaltung erfolgreich erstellt')
      router.push(`/events/${newEvent.id}`)
    } catch {
      toast.error('Unerwarteter Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Neue Veranstaltung"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Veranstaltungen', href: '/events' },
          { label: 'Neu' },
        ]}
      />

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          {STEPS.map((s, i) => (
            <span key={i} className={i === step ? 'text-foreground font-medium' : ''}>{s}</span>
          ))}
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} className="h-2" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Basic Data */}
        {step === 0 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Grunddaten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Veranstaltungstitel *</Label>
                <Input id="title" {...register('title')} placeholder="z.B. Sommerfestival 2025" />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Typ *</Label>
                  <Select
                    defaultValue="FESTIVAL"
                    onValueChange={(v) => setValue('event_type', v as EventFormData['event_type'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FESTIVAL">Festival</SelectItem>
                      <SelectItem value="CORPORATE">Firmenevent</SelectItem>
                      <SelectItem value="PRIVATE">Privat</SelectItem>
                      <SelectItem value="MARKET">Markt</SelectItem>
                      <SelectItem value="CATERING">Catering</SelectItem>
                      <SelectItem value="OTHER">Sonstige</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status *</Label>
                  <Select
                    defaultValue="DRAFT"
                    onValueChange={(v) => setValue('status', v as EventFormData['status'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Entwurf</SelectItem>
                      <SelectItem value="CONFIRMED">Bestätigt</SelectItem>
                      <SelectItem value="ACTIVE">Aktiv</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Startdatum *</Label>
                  <Input id="start_date" type="date" {...register('start_date')} />
                  {errors.start_date && <p className="text-sm text-destructive">{errors.start_date.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">Enddatum *</Label>
                  <Input id="end_date" type="date" {...register('end_date')} />
                  {errors.end_date && <p className="text-sm text-destructive">{errors.end_date.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Startzeit</Label>
                  <Input id="start_time" type="time" {...register('start_time')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">Endzeit</Label>
                  <Input id="end_time" type="time" {...register('end_time')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departure_time">Abfahrt</Label>
                  <Input id="departure_time" type="time" {...register('departure_time')} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Location & Contact */}
        {step === 1 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Ort &amp; Kontakt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Adresse</Label>
                <Input id="address" {...register('address')} placeholder="Musterstraße 1" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2 col-span-1">
                  <Label htmlFor="postal_code">PLZ</Label>
                  <Input id="postal_code" {...register('postal_code')} placeholder="12345" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="city">Stadt</Label>
                  <Input id="city" {...register('city')} placeholder="Berlin" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stand_number">Standnummer</Label>
                  <Input id="stand_number" {...register('stand_number')} placeholder="A-42" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_phone">Notfallnummer</Label>
                  <Input id="emergency_phone" {...register('emergency_phone')} placeholder="+49 ..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="organizer_name">Veranstaltername</Label>
                  <Input id="organizer_name" {...register('organizer_name')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organizer_contact">Veranstalter Kontakt</Label>
                  <Input id="organizer_contact" {...register('organizer_contact')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stand_contact_name">Standkontakt Name</Label>
                  <Input id="stand_contact_name" {...register('stand_contact_name')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stand_contact_phone">Standkontakt Tel.</Label>
                  <Input id="stand_contact_phone" {...register('stand_contact_phone')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="google_maps_url">Google Maps URL</Label>
                <Input id="google_maps_url" {...register('google_maps_url')} placeholder="https://maps.google.com/..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apple_maps_url">Apple Maps URL</Label>
                <Input id="apple_maps_url" {...register('apple_maps_url')} placeholder="https://maps.apple.com/..." />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Team & Logistics */}
        {step === 2 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Team &amp; Logistik</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Team und Logistik können nach dem Erstellen der Veranstaltung in der Detailansicht zugewiesen werden.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Notes */}
        {step === 3 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Interne Hinweise</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="internal_notes">Interne Notizen</Label>
                <Textarea
                  id="internal_notes"
                  {...register('internal_notes')}
                  placeholder="Interne Informationen, die nur für das Management sichtbar sind..."
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((s) => Math.max(s - 1, 0))}
            disabled={step === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Zurück
          </Button>

          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={nextStep}>
              Weiter
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Erstellen...
                </>
              ) : (
                'Veranstaltung erstellen'
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
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

const STEPS = ['Grunddaten', 'Ort & Kontakt', 'Hinweise']

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingEvent, setLoadingEvent] = useState(true)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
    trigger,
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
  })

  const loadEvent = useCallback(async () => {
    const supabase = createClient()
    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()

    if (!event) {
      toast.error('Veranstaltung nicht gefunden')
      router.push('/events')
      return
    }

    reset({
      title: event.title ?? '',
      event_type: event.event_type ?? 'FESTIVAL',
      start_date: event.start_date ?? '',
      end_date: event.end_date ?? '',
      start_time: event.start_time ?? '',
      end_time: event.end_time ?? '',
      departure_time: event.departure_time ?? '',
      status: event.status ?? 'DRAFT',
      address: event.address ?? '',
      city: event.city ?? '',
      postal_code: event.postal_code ?? '',
      country: event.country ?? 'DE',
      google_maps_url: event.google_maps_url ?? '',
      apple_maps_url: event.apple_maps_url ?? '',
      organizer_name: event.organizer_name ?? '',
      organizer_contact: event.organizer_contact ?? '',
      stand_contact_name: event.stand_contact_name ?? '',
      stand_contact_phone: event.stand_contact_phone ?? '',
      stand_number: event.stand_number ?? '',
      emergency_phone: event.emergency_phone ?? '',
      internal_notes: event.internal_notes ?? '',
    })

    setLoadingEvent(false)
  }, [id, reset, router])

  useEffect(() => {
    loadEvent()
  }, [loadEvent])

  async function nextStep() {
    const fieldsPerStep: (keyof EventFormData)[][] = [
      ['title', 'event_type', 'start_date', 'end_date', 'status'],
      ['address', 'city', 'postal_code'],
      [],
    ]
    const valid = await trigger(fieldsPerStep[step])
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  async function onSubmit(data: EventFormData) {
    setLoading(true)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('events')
        .update({
          ...data,
          google_maps_url: data.google_maps_url || null,
          apple_maps_url: data.apple_maps_url || null,
        })
        .eq('id', id)

      if (error) {
        toast.error('Fehler beim Speichern der Veranstaltung')
        return
      }

      toast.success('Veranstaltung gespeichert')
      router.push(`/events/${id}`)
    } catch {
      toast.error('Unerwarteter Fehler')
    } finally {
      setLoading(false)
    }
  }

  const eventType = watch('event_type')
  const status = watch('status')

  if (loadingEvent) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Veranstaltung bearbeiten"
        breadcrumbs={[
          { label: 'Veranstaltungen', href: '/events' },
          { label: 'Details', href: `/events/${id}` },
          { label: 'Bearbeiten' },
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
                    value={eventType}
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
                    value={status}
                    onValueChange={(v) => setValue('status', v as EventFormData['status'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Entwurf</SelectItem>
                      <SelectItem value="CONFIRMED">Bestätigt</SelectItem>
                      <SelectItem value="ACTIVE">Aktiv</SelectItem>
                      <SelectItem value="COMPLETED">Abgeschlossen</SelectItem>
                      <SelectItem value="CANCELLED">Storniert</SelectItem>
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

        {/* Step 3: Notes */}
        {step === 2 && (
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
            onClick={() => step === 0 ? router.push(`/events/${id}`) : setStep((s) => s - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {step === 0 ? 'Abbrechen' : 'Zurück'}
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
                  Speichern...
                </>
              ) : (
                'Änderungen speichern'
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}

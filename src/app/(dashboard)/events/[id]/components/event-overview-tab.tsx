import { MapPin, Clock, Phone, User, AlertCircle, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { formatDate, getStatusBadgeColor, getEventTypeLabel } from '@/lib/utils'
import type { Event } from '@/types'

interface EventOverviewTabProps {
  event: Event
  isManager: boolean
}

export function EventOverviewTab({ event, isManager }: EventOverviewTabProps) {
  const statusLabels: Record<string, string> = {
    DRAFT: 'Entwurf',
    CONFIRMED: 'Bestätigt',
    ACTIVE: 'Aktiv',
    COMPLETED: 'Abgeschlossen',
    CANCELLED: 'Storniert',
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* General Info */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Allgemeine Informationen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={getStatusBadgeColor(event.status)}>
              {statusLabels[event.status] ?? event.status}
            </Badge>
            <span className="text-sm text-muted-foreground">{getEventTypeLabel(event.event_type)}</span>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Datum & Zeit</p>
                <p className="text-muted-foreground">
                  {formatDate(event.start_date)}
                  {event.start_date !== event.end_date && ` – ${formatDate(event.end_date)}`}
                </p>
                {event.start_time && (
                  <p className="text-muted-foreground">
                    {event.start_time} – {event.end_time ?? '—'}
                  </p>
                )}
                {event.departure_time && (
                  <p className="text-muted-foreground">Abfahrt: {event.departure_time}</p>
                )}
              </div>
            </div>

            {(event.address || event.city) && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Adresse</p>
                  {event.address && <p className="text-muted-foreground">{event.address}</p>}
                  <p className="text-muted-foreground">
                    {event.postal_code} {event.city}
                  </p>
                  {event.stand_number && (
                    <p className="text-muted-foreground">Stand: {event.stand_number}</p>
                  )}
                  <div className="flex gap-2 mt-1">
                    {event.google_maps_url && (
                      <a
                        href={event.google_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                      >
                        Google Maps
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {event.apple_maps_url && (
                      <a
                        href={event.apple_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                      >
                        Apple Maps
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Ansprechpartner</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {event.organizer_name && (
            <div className="flex items-start gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Veranstalter</p>
                <p className="text-muted-foreground">{event.organizer_name}</p>
                {event.organizer_contact && (
                  <p className="text-muted-foreground">{event.organizer_contact}</p>
                )}
              </div>
            </div>
          )}

          {event.stand_contact_name && (
            <div className="flex items-start gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Standkontakt</p>
                <p className="text-muted-foreground">{event.stand_contact_name}</p>
                {event.stand_contact_phone && (
                  <p className="text-muted-foreground">{event.stand_contact_phone}</p>
                )}
              </div>
            </div>
          )}

          {event.emergency_phone && (
            <div className="flex items-start gap-2 text-sm">
              <Phone className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-400">Notfallnummer</p>
                <p className="text-muted-foreground">{event.emergency_phone}</p>
              </div>
            </div>
          )}

          {!event.organizer_name && !event.stand_contact_name && !event.emergency_phone && (
            <p className="text-sm text-muted-foreground">Keine Kontaktdaten hinterlegt</p>
          )}
        </CardContent>
      </Card>

      {/* Internal Notes - only for managers */}
      {isManager && event.internal_notes && (
        <Card className="border-border md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              Interne Hinweise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.internal_notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

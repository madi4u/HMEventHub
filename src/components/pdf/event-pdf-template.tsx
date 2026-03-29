/**
 * Event PDF Template
 * Used for server-side HTML generation for print/PDF export.
 * This component generates a print-friendly HTML document.
 *
 * In production, render this with React's renderToStaticMarkup or
 * use with @react-pdf/renderer for actual PDF generation.
 */

import { formatDate, formatCurrency, getEventTypeLabel } from '@/lib/utils'
import type { Event, EventDay, EventAssignment, Profile } from '@/types'

interface EventPdfTemplateProps {
  event: Event
  eventDays: EventDay[]
  assignments: (EventAssignment & { profile: Profile })[]
  generatedBy: string
  generatedAt: string
}

export function EventPdfTemplate({
  event,
  eventDays,
  assignments,
  generatedBy,
  generatedAt,
}: EventPdfTemplateProps) {
  const roleLabels: Record<string, string> = {
    STANDLEITER: 'Standleiter',
    EMPLOYEE: 'Mitarbeiter',
    DRIVER: 'Fahrer',
    SUPPORT: 'Support',
  }

  const statusLabels: Record<string, string> = {
    DRAFT: 'Entwurf',
    CONFIRMED: 'Bestätigt',
    ACTIVE: 'Aktiv',
    COMPLETED: 'Abgeschlossen',
    CANCELLED: 'Storniert',
  }

  return (
    <html lang="de">
      <head>
        <meta charSet="UTF-8" />
        <title>{`H+M EventHub - ${event.title}`}</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 12px; color: #111; background: white; padding: 32px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #000; margin-bottom: 20px; }
          .logo { font-size: 18px; font-weight: bold; }
          .meta { font-size: 10px; color: #666; text-align: right; }
          h1 { font-size: 20px; margin-bottom: 8px; }
          h2 { font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #555; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #ddd; }
          .section { margin-bottom: 20px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .info-row { display: flex; margin-bottom: 4px; }
          .info-label { font-weight: bold; min-width: 120px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th { background: #f0f0f0; text-align: left; padding: 6px 10px; font-size: 11px; }
          td { padding: 6px 10px; border-bottom: 1px solid #eee; }
          .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #ddd; display: flex; justify-content: space-between; font-size: 10px; color: #999; }
          @page { size: A4; margin: 20mm; }
          @media print { body { padding: 0; } }
        `}</style>
      </head>
      <body>
        <div className="header">
          <div>
            <div className="logo">H+M EventHub</div>
            <div style={{ fontSize: '10px', color: '#666' }}>Catering &amp; Foodtruck Management</div>
          </div>
          <div className="meta">
            <div>Erstellt: {generatedAt}</div>
            <div>Von: {generatedBy}</div>
          </div>
        </div>

        <div className="section">
          <h1>{event.title}</h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ background: '#eee', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
              {statusLabels[event.status] ?? event.status}
            </span>
            <span style={{ color: '#666', fontSize: '11px' }}>{getEventTypeLabel(event.event_type)}</span>
          </div>
        </div>

        <div className="grid">
          <div className="section">
            <h2>Veranstaltungsdaten</h2>
            <div className="info-row">
              <span className="info-label">Datum:</span>
              <span>{formatDate(event.start_date)}{event.start_date !== event.end_date ? ` – ${formatDate(event.end_date)}` : ''}</span>
            </div>
            {event.start_time && (
              <div className="info-row">
                <span className="info-label">Uhrzeit:</span>
                <span>{event.start_time} – {event.end_time ?? '—'}</span>
              </div>
            )}
            {event.departure_time && (
              <div className="info-row">
                <span className="info-label">Abfahrt:</span>
                <span>{event.departure_time}</span>
              </div>
            )}
            {event.stand_number && (
              <div className="info-row">
                <span className="info-label">Standnummer:</span>
                <span>{event.stand_number}</span>
              </div>
            )}
          </div>

          <div className="section">
            <h2>Adresse</h2>
            {event.address && <div>{event.address}</div>}
            <div>{event.postal_code} {event.city}</div>
          </div>
        </div>

        {assignments.length > 0 && (
          <div className="section">
            <h2>Team ({assignments.length})</h2>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Rolle</th>
                  <th>E-Mail</th>
                  <th>Telefon</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a.id}>
                    <td>{a.profile?.full_name ?? '—'}</td>
                    <td>{roleLabels[a.role_in_event] ?? a.role_in_event}</td>
                    <td>{a.profile?.email ?? '—'}</td>
                    <td>{a.profile?.phone ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {event.internal_notes && (
          <div className="section">
            <h2>Interne Hinweise</h2>
            <p style={{ whiteSpace: 'pre-wrap', color: '#444' }}>{event.internal_notes}</p>
          </div>
        )}

        <div className="footer">
          <span>H+M EventHub – Veranstaltungsbericht</span>
          <span>Seite 1</span>
        </div>
      </body>
    </html>
  )
}

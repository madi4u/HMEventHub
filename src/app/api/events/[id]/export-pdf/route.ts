import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { formatDate, formatCurrency, isManagerRole, slugify } from '@/lib/utils'
import type { UserRole } from '@/types'

function escapeHtml(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile || !isManagerRole(profile.role as UserRole)) {
    return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 403 })
  }

  const { data: event } = await supabase
    .from('events')
    .select(`
      *,
      event_days(*),
      assignments:event_assignments(*, profile:profiles(full_name, email, phone))
    `)
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (!event) {
    return NextResponse.json({ error: 'Veranstaltung nicht gefunden' }, { status: 404 })
  }

  // Generate HTML PDF
  const assignments = (event.assignments as { role_in_event: string; profile: { full_name: string; email: string; phone: string | null } }[]) ?? []
  const eventDays = (event.event_days as { event_date: string; day_label: string }[]) ?? []

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

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>H+M EventHub - ${escapeHtml(event.title)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #1a1a1a; background: white; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #1a1a1a; margin-bottom: 24px; }
  .logo { font-size: 20px; font-weight: 700; }
  .logo span { color: #2563eb; }
  .meta { text-align: right; color: #666; font-size: 11px; }
  h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
  .badge { display: inline-block; background: #f0f0f0; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #666; margin-bottom: 12px; padding-bottom: 4px; border-bottom: 1px solid #e0e0e0; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .info-row { display: flex; gap: 8px; margin-bottom: 6px; }
  .info-label { font-weight: 600; min-width: 120px; color: #555; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f5f5f5; text-align: left; padding: 8px 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; color: #666; }
  td { padding: 8px 12px; border-bottom: 1px solid #eee; }
  tr:last-child td { border-bottom: none; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e0e0e0; display: flex; justify-content: space-between; color: #999; font-size: 10px; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">H<span>+</span>M EventHub</div>
      <div style="color: #666; font-size: 11px; margin-top: 4px;">Catering &amp; Foodtruck Management</div>
    </div>
    <div class="meta">
      <div>Erstellt: ${new Date().toLocaleDateString('de-DE')} ${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</div>
      <div>Erstellt von: ${escapeHtml(profile.full_name)}</div>
    </div>
  </div>

  <div class="section">
    <h1>${escapeHtml(event.title)}</h1>
    <span class="badge">${escapeHtml(statusLabels[event.status] ?? event.status)}</span>
  </div>

  <div class="grid-2">
    <div class="section">
      <div class="section-title">Veranstaltungsdaten</div>
      <div class="info-row"><span class="info-label">Datum:</span>${escapeHtml(formatDate(event.start_date))}${event.start_date !== event.end_date ? ` – ${escapeHtml(formatDate(event.end_date))}` : ''}</div>
      ${event.start_time ? `<div class="info-row"><span class="info-label">Uhrzeit:</span>${escapeHtml(event.start_time)} – ${escapeHtml(event.end_time ?? '—')}</div>` : ''}
      ${event.departure_time ? `<div class="info-row"><span class="info-label">Abfahrt:</span>${escapeHtml(event.departure_time)}</div>` : ''}
      ${event.stand_number ? `<div class="info-row"><span class="info-label">Standnummer:</span>${escapeHtml(event.stand_number)}</div>` : ''}
    </div>

    <div class="section">
      <div class="section-title">Adresse</div>
      ${event.address ? `<div>${escapeHtml(event.address)}</div>` : ''}
      ${event.postal_code || event.city ? `<div>${escapeHtml(event.postal_code ?? '')} ${escapeHtml(event.city ?? '')}</div>` : ''}
      ${event.country ? `<div>${escapeHtml(event.country)}</div>` : ''}
    </div>
  </div>

  <div class="grid-2">
    ${event.organizer_name ? `<div class="section">
      <div class="section-title">Veranstalter</div>
      <div class="info-row"><span class="info-label">Name:</span>${escapeHtml(event.organizer_name)}</div>
      ${event.organizer_contact ? `<div class="info-row"><span class="info-label">Kontakt:</span>${escapeHtml(event.organizer_contact)}</div>` : ''}
    </div>` : ''}

    ${event.stand_contact_name ? `<div class="section">
      <div class="section-title">Standkontakt</div>
      <div class="info-row"><span class="info-label">Name:</span>${escapeHtml(event.stand_contact_name)}</div>
      ${event.stand_contact_phone ? `<div class="info-row"><span class="info-label">Telefon:</span>${escapeHtml(event.stand_contact_phone)}</div>` : ''}
    </div>` : ''}
  </div>

  ${event.emergency_phone ? `<div class="section">
    <div class="section-title">⚠ Notfallnummer</div>
    <div style="font-size: 14px; font-weight: 700; color: #dc2626;">${escapeHtml(event.emergency_phone)}</div>
  </div>` : ''}

  ${assignments.length > 0 ? `<div class="section">
    <div class="section-title">Team (${assignments.length} Personen)</div>
    <table>
      <thead><tr><th>Name</th><th>Rolle</th><th>E-Mail</th><th>Telefon</th></tr></thead>
      <tbody>
        ${assignments.map((a) => `<tr>
          <td>${escapeHtml(a.profile?.full_name ?? '—')}</td>
          <td>${escapeHtml(roleLabels[a.role_in_event] ?? a.role_in_event)}</td>
          <td>${escapeHtml(a.profile?.email ?? '—')}</td>
          <td>${escapeHtml(a.profile?.phone ?? '—')}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>` : ''}

  ${eventDays.length > 0 ? `<div class="section">
    <div class="section-title">Veranstaltungstage</div>
    <table>
      <thead><tr><th>Tag</th><th>Datum</th></tr></thead>
      <tbody>
        ${eventDays.map((d) => `<tr><td>${escapeHtml(d.day_label)}</td><td>${escapeHtml(formatDate(d.event_date))}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>` : ''}

  ${event.internal_notes ? `<div class="section">
    <div class="section-title">Interne Hinweise</div>
    <p style="white-space: pre-wrap; color: #555;">${escapeHtml(event.internal_notes)}</p>
  </div>` : ''}

  <div class="footer">
    <span>H+M EventHub – Veranstaltungsbericht</span>
    <span>Seite 1</span>
  </div>
</body>
</html>`

  const fileName = `eventhub-${slugify(event.title)}-${event.start_date}.pdf`

  // Return as HTML (in production, use puppeteer or react-pdf for actual PDF)
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="${fileName.replace('.pdf', '.html')}"`,
    },
  })
}

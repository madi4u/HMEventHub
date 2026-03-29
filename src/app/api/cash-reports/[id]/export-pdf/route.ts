import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, isAdminRole } from '@/lib/utils'
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

  if (!profile || !isAdminRole(profile.role as UserRole)) {
    return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 403 })
  }

  const { data: report } = await supabase
    .from('cash_reports')
    .select(`
      *,
      denominations:cash_report_denominations(*),
      event_day:event_days(day_label, event_date),
      submitted_by:profiles(full_name),
      event:events(title)
    `)
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (!report) {
    return NextResponse.json({ error: 'Kassenblatt nicht gefunden' }, { status: 404 })
  }

  const denominations = (report.denominations as {
    denomination_type: string
    denomination_value: number
    quantity: number
    subtotal: number
  }[]) ?? []

  const notes = (denominations.filter((d) => d.denomination_type === 'NOTE')).sort((a, b) => b.denomination_value - a.denomination_value)
  const coins = (denominations.filter((d) => d.denomination_type === 'COIN')).sort((a, b) => b.denomination_value - a.denomination_value)

  const eventDay = report.event_day as unknown as { day_label: string; event_date: string } | null
  const submittedBy = report.submitted_by as unknown as { full_name: string } | null
  const event = report.event as unknown as { title: string } | null

  function formatDenomValue(val: number): string {
    if (val >= 1) return `${val} €`
    return `${val * 100} ct`
  }

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<title>Kassenblatt - ${escapeHtml(event?.title ?? '')}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #1a1a1a; background: white; padding: 40px; max-width: 600px; margin: 0 auto; }
  .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; }
  .logo { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
  h2 { font-size: 16px; margin-bottom: 4px; }
  .meta { color: #666; font-size: 11px; margin-top: 8px; }
  .section { margin-bottom: 20px; }
  .section-title { font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 6px 8px; background: #f5f5f5; font-size: 11px; font-weight: 600; }
  td { padding: 6px 8px; border-bottom: 1px solid #eee; }
  .text-right { text-align: right; }
  .total-row { font-weight: 700; font-size: 14px; }
  .total-row td { border-top: 2px solid #1a1a1a; padding-top: 10px; }
  .signature-area { border: 1px solid #ddd; height: 80px; border-radius: 4px; margin-top: 8px; display: flex; align-items: center; justify-content: center; color: #999; font-size: 11px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .info-item { margin-bottom: 6px; }
  .info-label { font-size: 10px; color: #666; text-transform: uppercase; }
  .info-value { font-weight: 600; margin-top: 2px; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e0e0e0; color: #999; font-size: 10px; text-align: center; }
</style>
</head>
<body>
  <div class="header">
    <div class="logo">H+M EventHub</div>
    <h2>Kassenblatt</h2>
    <div class="meta">
      ${escapeHtml(event?.title ?? '')} · ${escapeHtml(eventDay?.day_label ?? '')} · ${eventDay ? new Date(eventDay.event_date).toLocaleDateString('de-DE') : ''}
    </div>
  </div>

  <div class="section">
    <div class="info-grid">
      <div>
        <div class="info-item">
          <div class="info-label">Erstellt von</div>
          <div class="info-value">${escapeHtml(submittedBy?.full_name ?? '—')}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Eingereicht am</div>
          <div class="info-value">${report.submitted_at ? new Date(report.submitted_at).toLocaleString('de-DE') : '—'}</div>
        </div>
      </div>
      <div>
        <div class="info-item">
          <div class="info-label">Status</div>
          <div class="info-value">${escapeHtml(report.status)}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Gesamtbetrag</div>
          <div class="info-value" style="font-size: 16px;">${formatCurrency(report.total_amount ?? 0)}</div>
        </div>
      </div>
    </div>
  </div>

  ${notes.length > 0 ? `<div class="section">
    <div class="section-title">Scheine</div>
    <table>
      <thead><tr><th>Stückelung</th><th class="text-right">Anzahl</th><th class="text-right">Betrag</th></tr></thead>
      <tbody>
        ${notes.map((d) => d.quantity > 0 ? `<tr>
          <td>${formatDenomValue(d.denomination_value)}</td>
          <td class="text-right">${d.quantity}</td>
          <td class="text-right">${formatCurrency(d.subtotal)}</td>
        </tr>` : '').join('')}
      </tbody>
    </table>
  </div>` : ''}

  ${coins.length > 0 ? `<div class="section">
    <div class="section-title">Münzen</div>
    <table>
      <thead><tr><th>Stückelung</th><th class="text-right">Anzahl</th><th class="text-right">Betrag</th></tr></thead>
      <tbody>
        ${coins.map((d) => d.quantity > 0 ? `<tr>
          <td>${formatDenomValue(d.denomination_value)}</td>
          <td class="text-right">${d.quantity}</td>
          <td class="text-right">${formatCurrency(d.subtotal)}</td>
        </tr>` : '').join('')}
      </tbody>
    </table>
  </div>` : ''}

  <table>
    <tr class="total-row">
      <td>Gesamtbetrag</td>
      <td class="text-right"></td>
      <td class="text-right">${formatCurrency(report.total_amount ?? 0)}</td>
    </tr>
  </table>

  ${report.notes ? `<div class="section" style="margin-top: 20px;">
    <div class="section-title">Hinweise</div>
    <p style="color: #555;">${escapeHtml(report.notes)}</p>
  </div>` : ''}

  <div class="section" style="margin-top: 24px;">
    <div class="section-title">Unterschrift</div>
    <div class="signature-area">
      ${report.signature_file_path ? 'Unterschrift vorhanden' : 'Keine Unterschrift'}
    </div>
  </div>

  <div class="footer">
    H+M EventHub · Generiert am ${new Date().toLocaleString('de-DE')}
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="kassenblatt-${id}.html"`,
    },
  })
}

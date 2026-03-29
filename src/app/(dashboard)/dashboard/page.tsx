import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  CalendarDays,
  Clock,
  DollarSign,
  FileText,
  AlertCircle,
  ClipboardList,
  Activity,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { StatsCard } from '@/components/dashboard/stats-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency, getStatusBadgeColor } from '@/lib/utils'
import type { Event, CashReport, ActivityLog, UserRole } from '@/types'

const MANAGER_ROLES: UserRole[] = ['SUPERADMIN', 'TENANT_ADMIN', 'OWNER', 'EVENT_MANAGER']

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile || !MANAGER_ROLES.includes(profile.role as UserRole)) {
    redirect('/my-events')
  }

  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Fetch stats in parallel
  const [
    { data: upcomingEvents },
    { data: activeEvents },
    { data: openCashReports },
    { data: recentActivity },
    { data: nextEvents },
    { data: openCashReportsList },
  ] = await Promise.all([
    supabase
      .from('events')
      .select('id', { count: 'exact' })
      .eq('tenant_id', profile.tenant_id)
      .gte('start_date', today)
      .in('status', ['CONFIRMED', 'DRAFT']),
    supabase
      .from('events')
      .select('id', { count: 'exact' })
      .eq('tenant_id', profile.tenant_id)
      .eq('status', 'ACTIVE'),
    supabase
      .from('cash_reports')
      .select('id, total_amount', { count: 'exact' })
      .eq('tenant_id', profile.tenant_id)
      .neq('status', 'FINAL'),
    supabase
      .from('activity_logs')
      .select('*, actor:profiles(full_name)')
      .eq('tenant_id', profile.tenant_id)
      .gte('created_at', weekAgo)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('events')
      .select('id, title, event_type, start_date, end_date, status, city')
      .eq('tenant_id', profile.tenant_id)
      .gte('start_date', today)
      .order('start_date', { ascending: true })
      .limit(5),
    supabase
      .from('cash_reports')
      .select('id, total_amount, status, event_id, events(title)')
      .eq('tenant_id', profile.tenant_id)
      .neq('status', 'FINAL')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const totalRevenue = openCashReports?.reduce((sum, r) => sum + (r.total_amount ?? 0), 0) ?? 0

  const statusLabels: Record<string, string> = {
    DRAFT: 'Entwurf',
    CONFIRMED: 'Bestätigt',
    ACTIVE: 'Aktiv',
    COMPLETED: 'Abgeschlossen',
    CANCELLED: 'Storniert',
    OPEN: 'Offen',
    SUBMITTED: 'Eingereicht',
    FINAL: 'Final',
  }

  const eventTypeLabels: Record<string, string> = {
    FESTIVAL: 'Festival',
    CORPORATE: 'Firmenevent',
    PRIVATE: 'Privat',
    MARKET: 'Markt',
    CATERING: 'Catering',
    OTHER: 'Sonstige',
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Dashboard"
        description="Willkommen zurück"
        breadcrumbs={[{ label: 'Dashboard' }]}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard
          title="Bevorstehende Events"
          value={upcomingEvents?.length ?? 0}
          icon={CalendarDays}
          href="/events"
          className="xl:col-span-1"
        />
        <StatsCard
          title="Aktive Events"
          value={activeEvents?.length ?? 0}
          icon={Activity}
          href="/events?status=ACTIVE"
          className="xl:col-span-1"
        />
        <StatsCard
          title="Offene Kassenblätter"
          value={openCashReports?.length ?? 0}
          icon={DollarSign}
          href="/events"
          className="xl:col-span-1"
        />
        <StatsCard
          title="Offener Betrag"
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
          className="xl:col-span-1"
        />
        <StatsCard
          title="Fehlende Zeiterfassungen"
          value="—"
          icon={Clock}
          className="xl:col-span-1"
        />
        <StatsCard
          title="Offene Kontrollblätter"
          value="—"
          icon={ClipboardList}
          className="xl:col-span-1"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Events */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Nächste Veranstaltungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!nextEvents || nextEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Keine bevorstehenden Veranstaltungen
              </p>
            ) : (
              <div className="space-y-3">
                {nextEvents.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(event.start_date)} · {eventTypeLabels[event.event_type] ?? event.event_type}
                        {event.city && ` · ${event.city}`}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ml-2 flex-shrink-0 ${getStatusBadgeColor(event.status)}`}
                    >
                      {statusLabels[event.status] ?? event.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Open Cash Reports */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Offene Kassenblätter
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!openCashReportsList || openCashReportsList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Keine offenen Kassenblätter
              </p>
            ) : (
              <div className="space-y-3">
                {openCashReportsList.map((report) => {
                  const ev = report.events as unknown as { title: string } | null
                  return (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">
                          {ev?.title ?? 'Unbekannte Veranstaltung'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(report.total_amount ?? 0)}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs ml-2 flex-shrink-0 ${getStatusBadgeColor(report.status)}`}
                      >
                        {statusLabels[report.status] ?? report.status}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Letzte Aktivitäten
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!recentActivity || recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Keine Aktivitäten
              </p>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((log) => {
                  const actor = log.actor as unknown as { full_name: string } | null
                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 py-2 border-b border-border last:border-0"
                    >
                      <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{actor?.full_name ?? 'System'}</span>
                          {' '}{log.action}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString('de-DE')}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

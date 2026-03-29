'use client'

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
import { PageHeader } from '@/components/layout/page-header'
import { StatsCard } from '@/components/dashboard/stats-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency, getStatusBadgeColor, getEventTypeLabel } from '@/lib/utils'
import { useTranslation } from '@/i18n'

interface DashboardClientProps {
  upcomingCount: number
  activeCount: number
  openCashCount: number
  totalRevenue: number
  recentActivity: Array<{ id: string; action: string; created_at: string; actor: { full_name: string } | null }>
  nextEvents: Array<{ id: string; title: string; event_type: string; start_date: string; end_date: string; status: string; city: string | null }>
  openCashReportsList: Array<{ id: string; total_amount: number | null; status: string; events: { title: string } | null }>
}

export function DashboardClient({
  upcomingCount,
  activeCount,
  openCashCount,
  totalRevenue,
  recentActivity,
  nextEvents,
  openCashReportsList,
}: DashboardClientProps) {
  const { t, language } = useTranslation()

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t('dashboard.title')}
        description={t('dashboard.welcome')}
        breadcrumbs={[{ label: t('dashboard.title') }]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard
          title={t('dashboard.upcomingEvents')}
          value={upcomingCount}
          icon={CalendarDays}
          href="/events"
          className="xl:col-span-1"
        />
        <StatsCard
          title={t('dashboard.activeEvents')}
          value={activeCount}
          icon={Activity}
          href="/events?status=ACTIVE"
          className="xl:col-span-1"
        />
        <StatsCard
          title={t('dashboard.openCashReports')}
          value={openCashCount}
          icon={DollarSign}
          href="/events"
          className="xl:col-span-1"
        />
        <StatsCard
          title={t('dashboard.openAmount')}
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
          className="xl:col-span-1"
        />
        <StatsCard
          title={t('dashboard.missingTimeEntries')}
          value="—"
          icon={Clock}
          className="xl:col-span-1"
        />
        <StatsCard
          title={t('dashboard.openChecklists')}
          value="—"
          icon={ClipboardList}
          className="xl:col-span-1"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {t('dashboard.nextEvents')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('dashboard.noUpcomingEvents')}
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
                        {formatDate(event.start_date)} · {getEventTypeLabel(event.event_type, language)}
                        {event.city && ` · ${event.city}`}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ml-2 flex-shrink-0 ${getStatusBadgeColor(event.status)}`}
                    >
                      {t(`status.${event.status}` as Parameters<typeof t>[0]) || event.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('dashboard.openCashReportsList')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {openCashReportsList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('dashboard.openCashReports')}
              </p>
            ) : (
              <div className="space-y-3">
                {openCashReportsList.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {report.events?.title ?? t('common.unknown')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(report.total_amount ?? 0)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ml-2 flex-shrink-0 ${getStatusBadgeColor(report.status)}`}
                    >
                      {t(`status.${report.status}` as Parameters<typeof t>[0]) || report.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              {t('dashboard.recentActivity')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('dashboard.noActivity')}
              </p>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 py-2 border-b border-border last:border-0"
                  >
                    <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{log.actor?.full_name ?? 'System'}</span>
                        {' '}{log.action}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString(language === 'de' ? 'de-DE' : language === 'es' ? 'es-ES' : 'en-GB')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from './dashboard-client'
import type { UserRole } from '@/types'

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

  return (
    <DashboardClient
      upcomingCount={upcomingEvents?.length ?? 0}
      activeCount={activeEvents?.length ?? 0}
      openCashCount={openCashReports?.length ?? 0}
      totalRevenue={totalRevenue}
      recentActivity={(recentActivity ?? []).map((log) => ({
        id: log.id,
        action: log.action,
        created_at: log.created_at,
        actor: (log.actor as { full_name: string } | null),
      }))}
      nextEvents={(nextEvents ?? []).map((e) => ({
        id: e.id,
        title: e.title,
        event_type: e.event_type,
        start_date: e.start_date,
        end_date: e.end_date,
        status: e.status,
        city: e.city,
      }))}
      openCashReportsList={(openCashReportsList ?? []).map((r) => ({
        id: r.id,
        total_amount: r.total_amount,
        status: r.status,
        events: (r.events as unknown as { title: string } | null),
      }))}
    />
  )
}

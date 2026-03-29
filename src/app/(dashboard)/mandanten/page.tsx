import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { isAdminRole } from '@/lib/utils'
import type { UserRole } from '@/types'
import { MandantForm } from './mandant-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, CalendarDays, Building2 } from 'lucide-react'

export default async function MandantenPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (!isAdminRole(profile.role as UserRole)) redirect('/dashboard')

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', profile.tenant_id)
    .single()

  if (!tenant) redirect('/dashboard')

  // Stats
  const [{ count: userCount }, { count: eventCount }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
  ])

  const statusLabels: Record<string, string> = {
    ACTIVE: 'Aktiv',
    INACTIVE: 'Inaktiv',
    SUSPENDED: 'Gesperrt',
  }
  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-500/20 text-green-400 border-green-500/30',
    INACTIVE: 'bg-muted text-muted-foreground border-border',
    SUSPENDED: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Mandant"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Mandant' },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sidebar-primary/20 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-sidebar-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge variant="outline" className={`text-xs mt-0.5 ${statusColors[tenant.status] ?? ''}`}>
                {statusLabels[tenant.status] ?? tenant.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sidebar-primary/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-sidebar-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Benutzer</p>
              <p className="text-2xl font-bold">{userCount ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sidebar-primary/20 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-sidebar-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Veranstaltungen</p>
              <p className="text-2xl font-bold">{eventCount ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Form */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Firmendetails bearbeiten</CardTitle>
        </CardHeader>
        <CardContent>
          <MandantForm tenant={tenant} />
        </CardContent>
      </Card>
    </div>
  )
}

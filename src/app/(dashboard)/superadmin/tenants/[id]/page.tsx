import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { TenantEditForm } from './tenant-edit-form'
import { TenantUsersTable } from './tenant-users-table'
import { CalendarDays, Users } from 'lucide-react'

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single()
  if (!profile || profile.role !== 'TENANT_ADMIN') redirect('/dashboard')

  const admin = createAdminClient()

  const { data: tenant } = await admin.from('tenants').select('*').eq('id', id).single()
  if (!tenant) notFound()

  const [{ data: users }, { count: eventCount }] = await Promise.all([
    admin.from('profiles').select('*').eq('tenant_id', id).order('full_name'),
    admin.from('events').select('*', { count: 'exact', head: true }).eq('tenant_id', id),
  ])

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-500/20 text-green-400 border-green-500/30',
    INACTIVE: 'bg-muted text-muted-foreground border-border',
    SUSPENDED: 'bg-red-500/20 text-red-400 border-red-500/30',
  }
  const statusLabels: Record<string, string> = { ACTIVE: 'Aktiv', INACTIVE: 'Inaktiv', SUSPENDED: 'Gesperrt' }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title={tenant.name}
        breadcrumbs={[
          { label: 'Superadmin', href: '/superadmin' },
          { label: tenant.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs ${statusColors[tenant.status] ?? ''}`}>
              {statusLabels[tenant.status] ?? tenant.status}
            </Badge>
            <span className="text-xs text-muted-foreground">Erstellt: {formatDate(tenant.created_at)}</span>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-border">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sidebar-primary/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-sidebar-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Benutzer</p>
              <p className="text-2xl font-bold">{users?.length ?? 0}</p>
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

      {/* Edit Tenant */}
      <Card className="border-border">
        <CardHeader><CardTitle className="text-base">Mandant bearbeiten</CardTitle></CardHeader>
        <CardContent>
          <TenantEditForm tenant={tenant} />
        </CardContent>
      </Card>

      {/* Users */}
      <Card className="border-border">
        <CardHeader><CardTitle className="text-base">Benutzer ({users?.length ?? 0})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <TenantUsersTable tenantId={id} users={users ?? []} />
        </CardContent>
      </Card>
    </div>
  )
}

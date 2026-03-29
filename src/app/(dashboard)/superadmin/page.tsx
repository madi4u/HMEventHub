import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/layout/page-header'
import { StatsCard } from '@/components/dashboard/stats-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/utils'

export default async function SuperadminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'TENANT_ADMIN') redirect('/dashboard')

  const admin = createAdminClient()

  const [
    { data: tenants, count: tenantCount },
    { data: allProfiles, count: userCount },
  ] = await Promise.all([
    admin.from('tenants').select('*', { count: 'exact' }).order('created_at', { ascending: false }),
    admin.from('profiles').select('*', { count: 'exact' }),
  ])

  const activeTenants = tenants?.filter((t) => t.status === 'ACTIVE').length ?? 0

  // Count users and events per tenant
  const tenantStats = await Promise.all(
    (tenants ?? []).map(async (tenant) => {
      const [{ count: uc }, { count: ec }] = await Promise.all([
        admin.from('profiles').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
        admin.from('events').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
      ])
      return { tenantId: tenant.id, userCount: uc ?? 0, eventCount: ec ?? 0 }
    })
  )

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-500/20 text-green-400 border-green-500/30',
    INACTIVE: 'bg-muted text-muted-foreground border-border',
    SUSPENDED: 'bg-red-500/20 text-red-400 border-red-500/30',
  }

  const statusLabels: Record<string, string> = {
    ACTIVE: 'Aktiv',
    INACTIVE: 'Inaktiv',
    SUSPENDED: 'Gesperrt',
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Superadmin"
        breadcrumbs={[{ label: 'Superadmin' }]}
        actions={
          <Link href="/superadmin/tenants/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Neuer Mandant
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Mandanten gesamt"
          value={tenantCount ?? 0}
          icon={Building2}
        />
        <StatsCard
          title="Aktive Mandanten"
          value={activeTenants}
          icon={Building2}
        />
        <StatsCard
          title="Benutzer gesamt"
          value={userCount ?? 0}
          icon={Building2}
        />
      </div>

      <Card className="border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Benutzer</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Erstellt</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!tenants || tenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Keine Mandanten vorhanden
                  </TableCell>
                </TableRow>
              ) : (
                tenants.map((tenant) => {
                  const stats = tenantStats.find((s) => s.tenantId === tenant.id)
                  return (
                    <TableRow key={tenant.id} className="border-border">
                      <TableCell className="font-medium">{tenant.name}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{tenant.slug}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${statusColors[tenant.status] ?? ''}`}
                        >
                          {statusLabels[tenant.status] ?? tenant.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{stats?.userCount ?? 0}</TableCell>
                      <TableCell className="text-sm">{stats?.eventCount ?? 0}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(tenant.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/superadmin/tenants/${tenant.id}`}>
                          <Button variant="ghost" size="sm">Verwalten</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

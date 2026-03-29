import { redirect } from 'next/navigation'
import { Plus, Truck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { isManagerRole } from '@/lib/utils'
import type { Vehicle, Foodtruck, UserRole } from '@/types'

export default async function LogisticsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (!isManagerRole(profile.role as UserRole)) redirect('/my-events')

  const [
    { data: vehicles },
    { data: foodtrucks },
    { data: coolingTrailers },
    { data: equipment },
  ] = await Promise.all([
    supabase.from('vehicles').select('*').eq('tenant_id', profile.tenant_id).order('name'),
    supabase.from('foodtrucks').select('*').eq('tenant_id', profile.tenant_id).order('name'),
    supabase.from('cooling_trailers').select('*').eq('tenant_id', profile.tenant_id).order('name'),
    supabase.from('equipment').select('*').eq('tenant_id', profile.tenant_id).order('name'),
  ])

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-500/20 text-green-400 border-green-500/30',
    INACTIVE: 'bg-muted text-muted-foreground border-border',
    IN_REPAIR: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  }

  const statusLabels: Record<string, string> = {
    ACTIVE: 'Aktiv',
    INACTIVE: 'Inaktiv',
    IN_REPAIR: 'In Reparatur',
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Logistik"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Logistik' },
        ]}
      />

      <Tabs defaultValue="vehicles">
        <TabsList>
          <TabsTrigger value="vehicles">Fahrzeuge ({vehicles?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="foodtrucks">Foodtrucks ({foodtrucks?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="cooling">Kühlwagen ({coolingTrailers?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="equipment">Equipment ({equipment?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles">
          <Card className="border-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Name</TableHead>
                    <TableHead>Kennzeichen</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!vehicles || vehicles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        <Truck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        Keine Fahrzeuge vorhanden
                      </TableCell>
                    </TableRow>
                  ) : (
                    (vehicles as Vehicle[]).map((v) => (
                      <TableRow key={v.id} className="border-border">
                        <TableCell className="font-medium">{v.name}</TableCell>
                        <TableCell className="text-muted-foreground">{v.license_plate ?? '—'}</TableCell>
                        <TableCell className="text-muted-foreground">{v.type ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${statusColors[v.status] ?? ''}`}>
                            {statusLabels[v.status] ?? v.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">Bearbeiten</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="foodtrucks">
          <Card className="border-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Name</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!foodtrucks || foodtrucks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Keine Foodtrucks vorhanden
                      </TableCell>
                    </TableRow>
                  ) : (
                    (foodtrucks as Foodtruck[]).map((f) => (
                      <TableRow key={f.id} className="border-border">
                        <TableCell className="font-medium">{f.name}</TableCell>
                        <TableCell className="text-muted-foreground">{f.type ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${statusColors[f.status] ?? ''}`}>
                            {f.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">Bearbeiten</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cooling">
          <Card className="border-border">
            <CardContent className="text-center py-8 text-muted-foreground">
              {coolingTrailers?.length === 0 ? 'Keine Kühlwagen vorhanden' : `${coolingTrailers?.length} Kühlwagen`}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipment">
          <Card className="border-border">
            <CardContent className="text-center py-8 text-muted-foreground">
              {equipment?.length === 0 ? 'Kein Equipment vorhanden' : `${equipment?.length} Equipment-Einträge`}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

'use client'

import { Truck } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useTranslation } from '@/i18n'
import { AddLogisticsDialog } from './add-logistics-dialog'
import type { Vehicle, Foodtruck, CoolingTrailer, Equipment } from '@/types'

interface LogisticsClientProps {
  vehicles: Vehicle[]
  foodtrucks: Foodtruck[]
  coolingTrailers: CoolingTrailer[]
  equipment: Equipment[]
  tenantId: string
}

export function LogisticsClient({ vehicles, foodtrucks, coolingTrailers, equipment, tenantId }: LogisticsClientProps) {
  const { t, tenantName } = useTranslation()

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-500/20 text-green-400 border-green-500/30',
    INACTIVE: 'bg-muted text-muted-foreground border-border',
    IN_REPAIR: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  }

  const statusLabel: Record<string, string> = {
    ACTIVE: 'Aktiv',
    INACTIVE: 'Inaktiv',
    IN_REPAIR: 'In Reparatur',
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t('logistics.title')}
        breadcrumbs={[
          { label: tenantName || 'EventHub', href: '/dashboard' },
          { label: t('logistics.title') },
        ]}
      />

      <Tabs defaultValue="vehicles">
        <TabsList>
          <TabsTrigger value="vehicles">{t('logistics.vehicles')} ({vehicles.length})</TabsTrigger>
          <TabsTrigger value="foodtrucks">{t('logistics.foodtrucks')} ({foodtrucks.length})</TabsTrigger>
          <TabsTrigger value="cooling">{t('logistics.coolingTrailers')} ({coolingTrailers.length})</TabsTrigger>
          <TabsTrigger value="equipment">{t('logistics.equipment')} ({equipment.length})</TabsTrigger>
        </TabsList>

        {/* Fahrzeuge */}
        <TabsContent value="vehicles">
          <Card className="border-border">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-medium">{t('logistics.vehicles')}</span>
              <AddLogisticsDialog type="vehicles" tenantId={tenantId} />
            </div>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>{t('common.name')}</TableHead>
                    <TableHead>{t('logistics.licensePlate')}</TableHead>
                    <TableHead>{t('common.type')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>Notizen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        <Truck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        {t('logistics.noVehicles')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    vehicles.map((v) => (
                      <TableRow key={v.id} className="border-border">
                        <TableCell className="font-medium">{v.name}</TableCell>
                        <TableCell className="text-muted-foreground">{v.license_plate ?? '—'}</TableCell>
                        <TableCell className="text-muted-foreground">{v.type ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${statusColors[v.status] ?? ''}`}>
                            {statusLabel[v.status] ?? v.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{v.notes ?? '—'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Foodtrucks */}
        <TabsContent value="foodtrucks">
          <Card className="border-border">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-medium">{t('logistics.foodtrucks')}</span>
              <AddLogisticsDialog type="foodtrucks" tenantId={tenantId} />
            </div>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>{t('common.name')}</TableHead>
                    <TableHead>{t('common.type')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>Notizen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {foodtrucks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        {t('logistics.noFoodtrucks')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    foodtrucks.map((f) => (
                      <TableRow key={f.id} className="border-border">
                        <TableCell className="font-medium">{f.name}</TableCell>
                        <TableCell className="text-muted-foreground">{f.type ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${statusColors[f.status] ?? ''}`}>
                            {statusLabel[f.status] ?? f.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{f.notes ?? '—'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Kühlwagen */}
        <TabsContent value="cooling">
          <Card className="border-border">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-medium">{t('logistics.coolingTrailers')}</span>
              <AddLogisticsDialog type="cooling_trailers" tenantId={tenantId} />
            </div>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>{t('common.name')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>Notizen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coolingTrailers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        {t('logistics.noCoolingTrailers')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    coolingTrailers.map((c) => (
                      <TableRow key={c.id} className="border-border">
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${statusColors[c.status] ?? ''}`}>
                            {statusLabel[c.status] ?? c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.notes ?? '—'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment */}
        <TabsContent value="equipment">
          <Card className="border-border">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-medium">{t('logistics.equipment')}</span>
              <AddLogisticsDialog type="equipment" tenantId={tenantId} />
            </div>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>{t('common.name')}</TableHead>
                    <TableHead>Kategorie</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>Notizen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipment.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        {t('logistics.noEquipment')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    equipment.map((e) => (
                      <TableRow key={e.id} className="border-border">
                        <TableCell className="font-medium">{e.name}</TableCell>
                        <TableCell className="text-muted-foreground">{e.category ?? '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${statusColors[e.status] ?? ''}`}>
                            {statusLabel[e.status] ?? e.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{e.notes ?? '—'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

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
import type { Vehicle, Foodtruck } from '@/types'

interface LogisticsClientProps {
  vehicles: Vehicle[]
  foodtrucks: Foodtruck[]
  coolingTrailers: { id: string; name: string; status: string }[]
  equipment: { id: string; name: string; status: string }[]
}

export function LogisticsClient({ vehicles, foodtrucks, coolingTrailers, equipment }: LogisticsClientProps) {
  const { t, tenantName } = useTranslation()

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-500/20 text-green-400 border-green-500/30',
    INACTIVE: 'bg-muted text-muted-foreground border-border',
    IN_REPAIR: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  }

  function statusLabel(s: string) {
    return t(`status.${s}` as Parameters<typeof t>[0]) || s
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

        <TabsContent value="vehicles">
          <Card className="border-border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>{t('common.name')}</TableHead>
                    <TableHead>{t('logistics.licensePlate')}</TableHead>
                    <TableHead>{t('common.type')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
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
                            {statusLabel(v.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">{t('common.edit')}</Button>
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
                    <TableHead>{t('common.name')}</TableHead>
                    <TableHead>{t('common.type')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
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
                            {statusLabel(f.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">{t('common.edit')}</Button>
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
              {coolingTrailers.length === 0 ? t('logistics.noCoolingTrailers') : `${coolingTrailers.length} ${t('logistics.coolingTrailers')}`}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipment">
          <Card className="border-border">
            <CardContent className="text-center py-8 text-muted-foreground">
              {equipment.length === 0 ? t('logistics.noEquipment') : `${equipment.length} ${t('logistics.equipment')}`}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

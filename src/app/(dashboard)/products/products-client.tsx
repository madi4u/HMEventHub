'use client'

import { Plus, ShoppingBag } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useTranslation } from '@/i18n'
import type { Product } from '@/types'

type ProductWithCategory = Product & { category: { name: string } | null }

export function ProductsClient({ products }: { products: ProductWithCategory[] }) {
  const { t, tenantName } = useTranslation()

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t('products.title')}
        breadcrumbs={[
          { label: tenantName || 'EventHub', href: '/dashboard' },
          { label: t('products.title') },
        ]}
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            {t('products.newProduct')}
          </Button>
        }
      />

      <Card className="border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>{t('common.name')}</TableHead>
                <TableHead>{t('products.category')}</TableHead>
                <TableHead>{t('products.unit')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ShoppingBag className="h-8 w-8 opacity-50" />
                      <p className="text-sm">{t('products.noProducts')}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id} className="border-border">
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {product.category?.name ?? '—'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{product.unit}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={product.is_active
                          ? 'bg-green-500/20 text-green-400 border-green-500/30 text-xs'
                          : 'bg-muted text-muted-foreground border-border text-xs'
                        }
                      >
                        {product.is_active ? t('common.active') : t('common.inactive')}
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
    </div>
  )
}

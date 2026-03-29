import { redirect } from 'next/navigation'
import { Plus, ShoppingBag } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { isManagerRole } from '@/lib/utils'
import type { Product, UserRole } from '@/types'

export default async function ProductsPage() {
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

  const { data: products } = await supabase
    .from('products')
    .select('*, category:product_categories(name)')
    .eq('tenant_id', profile.tenant_id)
    .order('name', { ascending: true })

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Produkte"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Produkte' },
        ]}
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Neues Produkt
          </Button>
        }
      />

      <Card className="border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Name</TableHead>
                <TableHead>Kategorie</TableHead>
                <TableHead>Einheit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!products || products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ShoppingBag className="h-8 w-8 opacity-50" />
                      <p className="text-sm">Keine Produkte vorhanden</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                (products as (Product & { category: { name: string } | null })[]).map((product) => (
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
                        {product.is_active ? 'Aktiv' : 'Inaktiv'}
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
    </div>
  )
}

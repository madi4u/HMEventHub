import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductsClient } from './products-client'
import type { Product, ProductCategory, UserRole } from '@/types'

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
  const adminRoles: UserRole[] = ['SUPERADMIN', 'TENANT_ADMIN', 'OWNER']
  if (!adminRoles.includes(profile.role as UserRole)) redirect('/my-events')

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from('products')
      .select('*, category:product_categories(name)')
      .eq('tenant_id', profile.tenant_id)
      .order('name', { ascending: true }),
    supabase
      .from('product_categories')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('sort_order', { ascending: true }),
  ])

  return (
    <ProductsClient
      products={(products ?? []) as (Product & { category: { name: string } | null })[]}
      categories={(categories ?? []) as ProductCategory[]}
      tenantId={profile.tenant_id!}
    />
  )
}

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductsClient } from './products-client'
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
    <ProductsClient
      products={(products ?? []) as (Product & { category: { name: string } | null })[]}
    />
  )
}

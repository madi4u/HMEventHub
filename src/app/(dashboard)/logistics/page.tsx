import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogisticsClient } from './logistics-client'
import { isManagerRole } from '@/lib/utils'
import type { Vehicle, Foodtruck, CoolingTrailer, Equipment, UserRole } from '@/types'

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

  return (
    <LogisticsClient
      vehicles={(vehicles ?? []) as Vehicle[]}
      foodtrucks={(foodtrucks ?? []) as Foodtruck[]}
      coolingTrailers={(coolingTrailers ?? []) as CoolingTrailer[]}
      equipment={(equipment ?? []) as Equipment[]}
      tenantId={profile.tenant_id}
    />
  )
}

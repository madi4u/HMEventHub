import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingClient } from './onboarding-client'
import { isManagerRole } from '@/lib/utils'
import type { OnboardingModule, UserRole } from '@/types'

export default async function OnboardingPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/login')

  const isManager = isManagerRole(profile.role as UserRole)

  const { data: modules } = await supabase
    .from('onboarding_modules')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  return (
    <OnboardingClient
      modules={(modules ?? []) as OnboardingModule[]}
      isManager={isManager}
    />
  )
}

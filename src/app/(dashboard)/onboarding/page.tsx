import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { isManagerRole } from '@/lib/utils'
import type { OnboardingModule, UserRole, PreferredLanguage } from '@/types'

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
  const lang = (profile.preferred_language as PreferredLanguage) ?? 'de'

  const { data: modules } = await supabase
    .from('onboarding_modules')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  function getTitle(mod: OnboardingModule): string {
    if (lang === 'en' && mod.title_en) return mod.title_en
    if (lang === 'es' && mod.title_es) return mod.title_es
    return mod.title_de
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Onboarding"
        breadcrumbs={[{ label: 'Onboarding' }]}
        actions={
          isManager ? (
            <Link href="/onboarding/manage">
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Verwalten
              </Button>
            </Link>
          ) : undefined
        }
      />

      {!modules || modules.length === 0 ? (
        <Card className="border-border">
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Keine Onboarding-Module vorhanden</p>
            {isManager && (
              <Link href="/onboarding/manage" className="mt-4 inline-block">
                <Button size="sm" variant="outline">Module erstellen</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(modules as OnboardingModule[]).map((mod, index) => (
            <Link key={mod.id} href={`/onboarding/${mod.id}`}>
              <Card className="border-border hover:bg-accent/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-sidebar-primary">{index + 1}</span>
                    </div>
                    <CardTitle className="text-sm font-medium leading-tight">
                      {getTitle(mod)}
                    </CardTitle>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

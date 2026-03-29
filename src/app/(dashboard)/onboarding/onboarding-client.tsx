'use client'

import Link from 'next/link'
import { Plus, BookOpen } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslation } from '@/i18n'
import type { OnboardingModule } from '@/types'

interface OnboardingClientProps {
  modules: OnboardingModule[]
  isManager: boolean
}

export function OnboardingClient({ modules, isManager }: OnboardingClientProps) {
  const { t, language } = useTranslation()

  function getTitle(mod: OnboardingModule): string {
    if (language === 'en' && mod.title_en) return mod.title_en
    if (language === 'es' && mod.title_es) return mod.title_es
    return mod.title_de
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t('onboarding.title')}
        breadcrumbs={[{ label: t('onboarding.title') }]}
        actions={
          isManager ? (
            <Link href="/onboarding/manage">
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                {t('onboarding.manage')}
              </Button>
            </Link>
          ) : undefined
        }
      />

      {modules.length === 0 ? (
        <Card className="border-border">
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">{t('onboarding.noModules')}</p>
            {isManager && (
              <Link href="/onboarding/manage" className="mt-4 inline-block">
                <Button size="sm" variant="outline">{t('onboarding.createModules')}</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod, index) => (
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

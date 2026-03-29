import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { OnboardingModule, PreferredLanguage } from '@/types'

export default async function OnboardingModulePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/login')

  const lang = (profile.preferred_language as PreferredLanguage) ?? 'de'

  const { data: mod } = await supabase
    .from('onboarding_modules')
    .select('*, assets:onboarding_assets(*)')
    .eq('id', id)
    .single()

  if (!mod) notFound()

  const module = mod as OnboardingModule & { assets?: { id: string; file_path: string; file_type: string; title: string | null; sort_order: number }[] }

  function getTitle(): string {
    if (lang === 'en' && module.title_en) return module.title_en
    if (lang === 'es' && module.title_es) return module.title_es
    return module.title_de
  }

  function getContent(): string | null {
    if (lang === 'en' && module.content_en) return module.content_en
    if (lang === 'es' && module.content_es) return module.content_es
    return module.content_de
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl">
      <PageHeader
        title={getTitle()}
        breadcrumbs={[
          { label: 'Onboarding', href: '/onboarding' },
          { label: getTitle() },
        ]}
        actions={
          <Link href="/onboarding">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Zurück
            </Button>
          </Link>
        }
      />

      <Card className="border-border">
        <CardContent className="pt-6">
          {getContent() ? (
            <div
              className="prose prose-invert max-w-none text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap"
            >
              {getContent()}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Kein Inhalt vorhanden</p>
          )}
        </CardContent>
      </Card>

      {module.assets && module.assets.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Medien</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {module.assets
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((asset) => (
                <div key={asset.id} className="space-y-1">
                  {asset.file_type === 'IMAGE' && (
                    <div className="aspect-video rounded-md overflow-hidden border border-border bg-secondary">
                      <img
                        src={asset.file_path}
                        alt={asset.title ?? 'Bild'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {asset.file_type === 'VIDEO' && (
                    <video
                      controls
                      className="w-full rounded-md border border-border"
                    >
                      <source src={asset.file_path} />
                    </video>
                  )}
                  {asset.file_type === 'PDF' && (
                    <a
                      href={asset.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 rounded-md border border-border hover:bg-accent/50 text-sm text-blue-400"
                    >
                      {asset.title ?? 'PDF öffnen'}
                    </a>
                  )}
                  {asset.title && (
                    <p className="text-xs text-muted-foreground">{asset.title}</p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

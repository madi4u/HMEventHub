import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, ClipboardList } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { isManagerRole } from '@/lib/utils'
import type { ChecklistTemplate, UserRole } from '@/types'

export default async function ChecklistsPage() {
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

  const { data: templates } = await supabase
    .from('checklist_templates')
    .select('*, items:checklist_template_items(id)')
    .eq('tenant_id', profile.tenant_id)
    .order('name', { ascending: true })

  const categoryLabels: Record<string, string> = {
    GENERAL: 'Allgemein',
    HYGIENE: 'Hygiene',
    VEHICLE: 'Fahrzeug',
    CLEANING: 'Reinigung',
    OTHER: 'Sonstiges',
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Kontrollblätter"
        breadcrumbs={[{ label: 'Kontrollblätter' }]}
        actions={
          isManager ? (
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Neue Vorlage
            </Button>
          ) : undefined
        }
      />

      {!templates || templates.length === 0 ? (
        <Card className="border-border">
          <CardContent className="text-center py-12">
            <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Keine Vorlagen vorhanden</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(templates as (ChecklistTemplate & { items: { id: string }[] })[]).map((template) => (
            <Card key={template.id} className="border-border hover:bg-accent/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {categoryLabels[template.category] ?? template.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {template.description && (
                  <p className="text-xs text-muted-foreground mb-2">{template.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {template.items?.length ?? 0} Elemente
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

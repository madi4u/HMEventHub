'use client'

import Link from 'next/link'
import { Plus, ClipboardList } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/i18n'
import type { ChecklistTemplate } from '@/types'

type TemplateWithItems = ChecklistTemplate & { items: { id: string }[] }

interface ChecklistsClientProps {
  templates: TemplateWithItems[]
  isManager: boolean
}

export function ChecklistsClient({ templates, isManager }: ChecklistsClientProps) {
  const { t } = useTranslation()

  const categoryKey: Record<string, string> = {
    GENERAL: 'checklists.categoryGeneral',
    HYGIENE: 'checklists.categoryHygiene',
    VEHICLE: 'checklists.categoryVehicle',
    CLEANING: 'checklists.categoryCleaning',
    OTHER: 'checklists.categoryOther',
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t('checklists.title')}
        breadcrumbs={[{ label: t('checklists.title') }]}
        actions={
          isManager ? (
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              {t('checklists.newTemplate')}
            </Button>
          ) : undefined
        }
      />

      {templates.length === 0 ? (
        <Card className="border-border">
          <CardContent className="text-center py-12">
            <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">{t('checklists.noTemplates')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="border-border hover:bg-accent/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {categoryKey[template.category] ? t(categoryKey[template.category] as Parameters<typeof t>[0]) : template.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {template.description && (
                  <p className="text-xs text-muted-foreground mb-2">{template.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {template.items?.length ?? 0} {t('common.items')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

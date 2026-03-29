'use client'

import { Users } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { InviteUserDialog } from './invite-dialog'
import { EditCredentialsDialog } from './edit-credentials-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { getInitials, getRoleBadgeColor } from '@/lib/utils'
import { useTranslation } from '@/i18n'
import type { Profile } from '@/types'

const MANAGEABLE_ROLES = ['EVENT_MANAGER', 'STANDLEITER', 'EMPLOYEE', 'READ_ONLY']

export function UsersClient({ users }: { users: Profile[] }) {
  const { t, tenantName } = useTranslation()

  const langLabels: Record<string, string> = { de: '🇩🇪 DE', en: '🇬🇧 EN', es: '🇪🇸 ES' }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t('users.title')}
        breadcrumbs={[
          { label: tenantName || 'EventHub', href: '/dashboard' },
          { label: t('users.title') },
        ]}
        actions={<InviteUserDialog />}
      />

      <Card className="border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>{t('common.name')}</TableHead>
                <TableHead>{t('common.email')}</TableHead>
                <TableHead>{t('common.role')}</TableHead>
                <TableHead>{t('common.language')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Users className="h-8 w-8 opacity-50" />
                      <p className="text-sm">{t('users.noUsers')}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id} className="border-border">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-secondary text-xs">
                            {getInitials(u.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{u.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getRoleBadgeColor(u.role)}`}
                      >
                        {t(`roles.${u.role}` as Parameters<typeof t>[0]) || u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {langLabels[u.preferred_language] ?? u.preferred_language}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={u.is_active
                          ? 'text-xs bg-green-500/20 text-green-400 border-green-500/30'
                          : 'text-xs bg-muted text-muted-foreground border-border'
                        }
                      >
                        {u.is_active ? t('common.active') : t('common.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {MANAGEABLE_ROLES.includes(u.role) && (
                        <EditCredentialsDialog
                          profileId={u.id}
                          userName={u.full_name}
                          currentEmail={u.email}
                        />
                      )}
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

import { redirect } from 'next/navigation'
import { Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { InviteUserDialog } from './invite-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getInitials, getRoleBadgeColor, isAdminRole } from '@/lib/utils'
import type { Profile, UserRole } from '@/types'

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!profile) redirect('/login')
  if (!isAdminRole(profile.role as UserRole)) redirect('/my-events')

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .order('full_name', { ascending: true })

  const roleLabels: Record<string, string> = {
    SUPERADMIN: 'Superadmin',
    TENANT_ADMIN: 'Mandant-Admin',
    OWNER: 'Inhaber',
    EVENT_MANAGER: 'Veranstaltungsleiter',
    STANDLEITER: 'Standleiter',
    EMPLOYEE: 'Mitarbeiter',
    READ_ONLY: 'Lesezugriff',
  }

  const langLabels: Record<string, string> = { de: '🇩🇪 DE', en: '🇬🇧 EN', es: '🇪🇸 ES' }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Benutzer"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Benutzer' },
        ]}
        actions={<InviteUserDialog />}
      />

      <Card className="border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Name</TableHead>
                <TableHead>E-Mail</TableHead>
                <TableHead>Rolle</TableHead>
                <TableHead>Sprache</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!users || users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Users className="h-8 w-8 opacity-50" />
                      <p className="text-sm">Keine Benutzer vorhanden</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                (users as Profile[]).map((u) => (
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
                        {roleLabels[u.role] ?? u.role}
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
                        {u.is_active ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Bearbeiten</Button>
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

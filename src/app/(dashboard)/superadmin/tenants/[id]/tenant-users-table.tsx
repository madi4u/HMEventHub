'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, UserPlus, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'

const roleLabels: Record<string, string> = {
  SUPERADMIN: 'Superadmin', TENANT_ADMIN: 'Mandant-Admin', OWNER: 'Inhaber',
  EVENT_MANAGER: 'Veranstaltungsleiter', STANDLEITER: 'Standleiter',
  EMPLOYEE: 'Mitarbeiter', READ_ONLY: 'Lesezugriff',
}

interface UserProfile {
  id: string; user_id: string; full_name: string; email: string; role: string; is_active: boolean; preferred_language: string
}

const inviteSchema = z.object({
  email: z.string().email(), full_name: z.string().min(2),
  role: z.enum(['TENANT_ADMIN', 'OWNER', 'EVENT_MANAGER', 'STANDLEITER', 'EMPLOYEE', 'READ_ONLY']),
})
type InviteData = z.infer<typeof inviteSchema>

function EditUserDialog({ tenantId, user, onSaved }: { tenantId: string; user: UserProfile; onSaved: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [role, setRole] = useState(user.role)
  const [isActive, setIsActive] = useState(user.is_active)

  async function save() {
    setLoading(true)
    try {
      const res = await fetch(`/api/superadmin/tenants/${tenantId}/users`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: user.id, role, is_active: isActive }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error); return }
      toast.success('Benutzer aktualisiert')
      setOpen(false)
      onSaved()
    } catch { toast.error('Fehler') } finally { setLoading(false) }
  }

  async function deleteUser() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/superadmin/tenants/${tenantId}/users`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: user.id, userId: user.user_id }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error); return }
      toast.success(`${user.full_name} wurde gelöscht`)
      setOpen(false)
      onSaved()
    } catch { toast.error('Fehler') } finally { setDeleting(false) }
  }

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (!v) setConfirmDelete(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">Bearbeiten</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>{user.full_name} bearbeiten</DialogTitle></DialogHeader>
        {confirmDelete ? (
          <div className="space-y-4 py-2">
            <p className="text-sm">Benutzer <strong>{user.full_name}</strong> ({user.email}) wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDelete(false)}>Abbrechen</Button>
              <Button variant="destructive" onClick={deleteUser} disabled={deleting}>
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Endgültig löschen'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>E-Mail</Label>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="space-y-2">
                <Label>Rolle</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).filter(([k]) => k !== 'SUPERADMIN').map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={isActive ? 'active' : 'inactive'} onValueChange={(v) => setIsActive(v === 'active')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktiv</SelectItem>
                    <SelectItem value="inactive">Deaktiviert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
              <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-4 w-4 mr-1" />Benutzer löschen
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
                <Button onClick={save} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Speichern'}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function InviteUserDialog({ tenantId, onInvited }: { tenantId: string; onInvited: () => void }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<InviteData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'EMPLOYEE' },
  })

  async function onSubmit(data: InviteData) {
    setLoading(true)
    try {
      const res = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, tenant_id: tenantId, preferred_language: 'de' }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Fehler'); return }
      toast.success(`Einladung an ${data.email} gesendet`)
      reset(); setOpen(false); onInvited()
    } catch { toast.error('Fehler') } finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="m-4">
          <UserPlus className="h-4 w-4 mr-1" />Benutzer einladen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Benutzer zu diesem Mandanten einladen</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input {...register('full_name')} placeholder="Max Mustermann" disabled={loading} />
            {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>E-Mail *</Label>
            <Input type="email" {...register('email')} placeholder="max@firma.de" disabled={loading} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Rolle</Label>
            <Select defaultValue="EMPLOYEE" onValueChange={(v) => setValue('role', v as InviteData['role'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TENANT_ADMIN">Mandant-Admin</SelectItem>
                <SelectItem value="OWNER">Inhaber</SelectItem>
                <SelectItem value="EVENT_MANAGER">Veranstaltungsleiter</SelectItem>
                <SelectItem value="STANDLEITER">Standleiter</SelectItem>
                <SelectItem value="EMPLOYEE">Mitarbeiter</SelectItem>
                <SelectItem value="READ_ONLY">Lesezugriff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Einladen...</> : 'Einladung senden'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function TenantUsersTable({ tenantId, users: initialUsers }: { tenantId: string; users: UserProfile[] }) {
  const router = useRouter()

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow className="border-border">
            <TableHead>Name</TableHead>
            <TableHead>E-Mail</TableHead>
            <TableHead>Rolle</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialUsers.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">Keine Benutzer</TableCell></TableRow>
          ) : initialUsers.map((u) => (
            <TableRow key={u.id} className="border-border">
              <TableCell className="font-medium text-sm">{u.full_name}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">{roleLabels[u.role] ?? u.role}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`text-xs ${u.is_active ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-muted text-muted-foreground'}`}>
                  {u.is_active ? 'Aktiv' : 'Inaktiv'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <EditUserDialog tenantId={tenantId} user={u} onSaved={() => router.refresh()} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <InviteUserDialog tenantId={tenantId} onInvited={() => router.refresh()} />
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useTranslation } from '@/i18n'

const schema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  full_name: z.string().min(2, 'Mindestens 2 Zeichen'),
  role: z.enum(['TENANT_ADMIN', 'OWNER', 'EVENT_MANAGER', 'STANDLEITER', 'EMPLOYEE', 'READ_ONLY']),
  preferred_language: z.enum(['de', 'en', 'es']),
})

type FormData = z.infer<typeof schema>

export function InviteUserDialog() {
  const router = useRouter()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'EMPLOYEE', preferred_language: 'de' },
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const res = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error ?? 'Fehler beim Einladen')
        return
      }

      toast.success(`Einladung an ${data.email} gesendet`)
      reset()
      setOpen(false)
      router.refresh()
    } catch {
      toast.error('Netzwerkfehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          {t('users.invite')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('users.invite')}</DialogTitle>
          <DialogDescription>
            Der Benutzer erhält eine E-Mail mit einem Link zum Festlegen seines Passworts.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">{t('common.name')} *</Label>
            <Input id="full_name" {...register('full_name')} placeholder="Max Mustermann" disabled={loading} />
            {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('common.email')} *</Label>
            <Input id="email" type="email" {...register('email')} placeholder="max@example.com" disabled={loading} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>{t('common.role')} *</Label>
            <Select defaultValue="EMPLOYEE" onValueChange={(v) => setValue('role', v as FormData['role'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OWNER">{t('roles.OWNER')}</SelectItem>
                <SelectItem value="EVENT_MANAGER">{t('roles.EVENT_MANAGER')}</SelectItem>
                <SelectItem value="STANDLEITER">{t('roles.STANDLEITER')}</SelectItem>
                <SelectItem value="EMPLOYEE">{t('roles.EMPLOYEE')}</SelectItem>
                <SelectItem value="READ_ONLY">{t('roles.READ_ONLY')}</SelectItem>
                <SelectItem value="TENANT_ADMIN">{t('roles.TENANT_ADMIN')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('common.language')}</Label>
            <Select defaultValue="de" onValueChange={(v) => setValue('preferred_language', v as FormData['preferred_language'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="de">🇩🇪 {t('settings.german')}</SelectItem>
                <SelectItem value="en">🇬🇧 {t('settings.english')}</SelectItem>
                <SelectItem value="es">🇪🇸 {t('settings.spanish')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{t('common.loading')}</> : t('users.invite')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

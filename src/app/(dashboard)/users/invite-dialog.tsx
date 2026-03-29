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

const schema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  full_name: z.string().min(2, 'Mindestens 2 Zeichen'),
  role: z.enum(['TENANT_ADMIN', 'OWNER', 'EVENT_MANAGER', 'STANDLEITER', 'EMPLOYEE', 'READ_ONLY']),
  preferred_language: z.enum(['de', 'en', 'es']),
})

type FormData = z.infer<typeof schema>

export function InviteUserDialog() {
  const router = useRouter()
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
          Benutzer einladen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Benutzer einladen</DialogTitle>
          <DialogDescription>
            Der Benutzer erhält eine E-Mail mit einem Link zum Festlegen seines Passworts.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Name *</Label>
            <Input id="full_name" {...register('full_name')} placeholder="Max Mustermann" disabled={loading} />
            {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-Mail *</Label>
            <Input id="email" type="email" {...register('email')} placeholder="max@example.com" disabled={loading} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Rolle *</Label>
            <Select defaultValue="EMPLOYEE" onValueChange={(v) => setValue('role', v as FormData['role'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OWNER">Inhaber</SelectItem>
                <SelectItem value="EVENT_MANAGER">Veranstaltungsleiter</SelectItem>
                <SelectItem value="STANDLEITER">Standleiter</SelectItem>
                <SelectItem value="EMPLOYEE">Mitarbeiter</SelectItem>
                <SelectItem value="READ_ONLY">Lesezugriff</SelectItem>
                <SelectItem value="TENANT_ADMIN">Mandant-Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sprache</Label>
            <Select defaultValue="de" onValueChange={(v) => setValue('preferred_language', v as FormData['preferred_language'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                <SelectItem value="en">🇬🇧 English</SelectItem>
                <SelectItem value="es">🇪🇸 Español</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Einladen...</> : 'Einladung senden'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

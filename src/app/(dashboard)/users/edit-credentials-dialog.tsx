'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'

const schema = z.object({
  email: z.string().email('Ungültige E-Mail').or(z.literal('')),
  password: z.string().min(8, 'Mindestens 8 Zeichen').or(z.literal('')),
}).refine((d) => d.email || d.password, {
  message: 'Bitte E-Mail oder neues Passwort eingeben',
  path: ['email'],
})

type FormData = z.infer<typeof schema>

interface Props {
  profileId: string
  userName: string
  currentEmail: string
}

export function EditCredentialsDialog({ profileId, userName, currentEmail }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: currentEmail, password: '' },
  })

  async function onSubmit(data: FormData) {
    const payload: Record<string, string> = {}
    if (data.email && data.email !== currentEmail) payload.email = data.email
    if (data.password) payload.password = data.password

    if (Object.keys(payload).length === 0) {
      toast.info('Keine Änderungen vorgenommen')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/users/${profileId}/credentials`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Fehler'); return }
      toast.success('Zugangsdaten aktualisiert')
      setOpen(false)
      reset()
      router.refresh()
    } catch { toast.error('Fehler') } finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset({ email: currentEmail, password: '' }) }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <KeyRound className="h-3.5 w-3.5 mr-1" />
          Zugangsdaten
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Zugangsdaten — {userName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>E-Mail-Adresse</Label>
            <Input type="email" {...register('email')} disabled={loading} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Neues Passwort</Label>
            <Input type="password" placeholder="Leer lassen = nicht ändern" {...register('password')} disabled={loading} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            <p className="text-xs text-muted-foreground">Mindestens 8 Zeichen</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Speichern'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

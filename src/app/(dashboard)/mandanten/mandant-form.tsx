'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const schema = z.object({
  name: z.string().min(2, 'Mindestens 2 Zeichen'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Nur Kleinbuchstaben, Zahlen und Bindestriche'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
})

type FormData = z.infer<typeof schema>

interface Tenant {
  id: string
  name: string
  slug: string
  status: string
  logo_url: string | null
}

export function MandantForm({ tenant }: { tenant: Tenant }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status as FormData['status'],
    },
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('tenants')
        .update({ name: data.name, slug: data.slug, status: data.status })
        .eq('id', tenant.id)

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Mandant gespeichert')
      router.refresh()
    } catch {
      toast.error('Unerwarteter Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      <div className="space-y-2">
        <Label htmlFor="name">Firmenname *</Label>
        <Input id="name" {...register('name')} placeholder="Muster GmbH" disabled={loading} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">URL-Kürzel *</Label>
        <Input id="slug" {...register('slug')} placeholder="muster-gmbh" disabled={loading} />
        <p className="text-xs text-muted-foreground">Nur Kleinbuchstaben, Zahlen und Bindestriche</p>
        {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
      </div>

      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          defaultValue={tenant.status}
          onValueChange={(v) => setValue('status', v as FormData['status'])}
        >
          <SelectTrigger className="max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">Aktiv</SelectItem>
            <SelectItem value="INACTIVE">Inaktiv</SelectItem>
            <SelectItem value="SUSPENDED">Gesperrt</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Speichern...</> : 'Änderungen speichern'}
      </Button>
    </form>
  )
}

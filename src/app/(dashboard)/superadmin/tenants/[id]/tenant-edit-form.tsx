'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
})
type FormData = z.infer<typeof schema>

export function TenantEditForm({ tenant }: { tenant: { id: string; name: string; slug: string; status: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: tenant.name, slug: tenant.slug, status: tenant.status as FormData['status'] },
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const res = await fetch(`/api/superadmin/tenants/${tenant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error); return }
      toast.success('Mandant gespeichert')
      router.refresh()
    } catch { toast.error('Fehler') } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      <div className="space-y-2">
        <Label>Firmenname *</Label>
        <Input {...register('name')} disabled={loading} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Slug *</Label>
        <Input {...register('slug')} className="font-mono" disabled={loading} />
        {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select defaultValue={tenant.status} onValueChange={(v) => setValue('status', v as FormData['status'])}>
          <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
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

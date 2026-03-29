'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { slugify } from '@/lib/utils'

const tenantSchema = z.object({
  name: z.string().min(2, 'Mindestens 2 Zeichen'),
  slug: z.string().min(2, 'Mindestens 2 Zeichen').regex(/^[a-z0-9-]+$/, 'Nur Kleinbuchstaben, Zahlen und Bindestriche'),
  admin_name: z.string().min(2, 'Mindestens 2 Zeichen'),
  admin_email: z.string().email('Ungültige E-Mail'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
})

type TenantForm = z.infer<typeof tenantSchema>

export default function NewTenantPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TenantForm>({
    resolver: zodResolver(tenantSchema),
    defaultValues: { status: 'ACTIVE' },
  })

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setValue('name', value)
    setValue('slug', slugify(value))
  }

  async function onSubmit(data: TenantForm) {
    setLoading(true)
    try {
      const res = await fetch('/api/superadmin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Fehler beim Erstellen des Mandanten')
        return
      }
      toast.success(`Mandant erstellt und Einladung an ${data.admin_email} gesendet`)
      router.push('/superadmin')
    } catch {
      toast.error('Unerwarteter Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-lg">
      <PageHeader
        title="Neuer Mandant"
        breadcrumbs={[
          { label: 'Superadmin', href: '/superadmin' },
          { label: 'Neuer Mandant' },
        ]}
      />

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Mandant anlegen</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Mandantenname *</Label>
              <Input
                id="name"
                placeholder="z.B. H+M Catering GmbH"
                {...register('name')}
                onChange={handleNameChange}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                placeholder="hm-catering"
                {...register('slug')}
                className="font-mono"
              />
              {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
              <p className="text-xs text-muted-foreground">Eindeutiger Bezeichner (wird automatisch generiert)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin_name">Admin Name *</Label>
              <Input
                id="admin_name"
                placeholder="Max Mustermann"
                {...register('admin_name')}
              />
              {errors.admin_name && <p className="text-sm text-destructive">{errors.admin_name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin_email">Admin E-Mail *</Label>
              <Input
                id="admin_email"
                type="email"
                placeholder="admin@mandant.de"
                {...register('admin_email')}
              />
              {errors.admin_email && <p className="text-sm text-destructive">{errors.admin_email.message}</p>}
              <p className="text-xs text-muted-foreground">Diese Person erhält eine Einladungs-E-Mail</p>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select defaultValue="ACTIVE" onValueChange={(v) => setValue('status', v as TenantForm['status'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Aktiv</SelectItem>
                  <SelectItem value="INACTIVE">Inaktiv</SelectItem>
                  <SelectItem value="SUSPENDED">Gesperrt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Mandant erstellen & einladen
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/superadmin')}
              >
                Abbrechen
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

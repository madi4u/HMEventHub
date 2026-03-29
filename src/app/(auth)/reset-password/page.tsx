'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Link from 'next/link'
import { Loader2, Mail, ArrowLeft } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const resetSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
})

type ResetForm = z.infer<typeof resetSchema>

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  })

  async function onSubmit(data: ResetForm) {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/update-password`,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      setSent(true)
      toast.success(t('auth.resetPasswordSuccess'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Verbindung fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-2">
            <Mail className="h-6 w-6 text-green-400" />
          </div>
          <CardTitle className="text-2xl">{t('auth.resetPassword')}</CardTitle>
          <CardDescription>{t('auth.resetPasswordSuccess')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('auth.backToLogin')}
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">{t('auth.resetPassword')}</CardTitle>
        <CardDescription className="text-center">{t('auth.resetPasswordSubtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="max@example.com"
                className="pl-9"
                {...register('email')}
                disabled={loading}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              t('auth.resetPasswordButton')
            )}
          </Button>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              {t('auth.backToLogin')}
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Link from 'next/link'
import { Loader2, Mail, Lock } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(6, 'Mindestens 6 Zeichen'),
})

type LoginForm = z.infer<typeof loginSchema>

function LoginForm() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginForm) {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      if (authData.user) {
        // Fetch profile to determine role-based redirect and check active status
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, is_active')
          .eq('user_id', authData.user.id)
          .single()

        if (profile?.is_active === false) {
          await supabase.auth.signOut()
          toast.error('Ihr Konto wurde deaktiviert. Bitte wenden Sie sich an Ihren Administrator.')
          return
        }

        if (profile) {
          const employeeRoles = ['EMPLOYEE', 'STANDLEITER', 'READ_ONLY']
          if (employeeRoles.includes(profile.role)) {
            router.push('/my-events')
          } else {
            router.push(redirectTo)
          }
        } else {
          router.push(redirectTo)
        }

        router.refresh()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Verbindung fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">{t('auth.loginTitle')}</CardTitle>
        <CardDescription className="text-center">{t('auth.loginSubtitle')}</CardDescription>
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <Link
                href="/reset-password"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="pl-9"
                {...register('password')}
                disabled={loading}
              />
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              t('auth.loginButton')
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 rounded-lg bg-card" />}>
      <LoginForm />
    </Suspense>
  )
}

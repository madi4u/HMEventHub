'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Camera } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { getInitials } from '@/lib/utils'
import type { Profile, PreferredLanguage } from '@/types'
import { useTranslation } from '@/i18n'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Mindestens 2 Zeichen'),
  phone: z.string().optional(),
  preferred_language: z.enum(['de', 'en', 'es']),
})

const passwordSchema = z.object({
  new_password: z.string().min(8, 'Mindestens 8 Zeichen'),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirm_password'],
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

export default function ProfileSettingsPage() {
  const { t, setLanguage } = useTranslation()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    setValue: setProfileValue,
    formState: { errors: profileErrors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        const p = data as Profile
        setProfile(p)
        setProfileValue('full_name', p.full_name)
        setProfileValue('phone', p.phone ?? '')
        setProfileValue('preferred_language', p.preferred_language)
      }
      setLoadingProfile(false)
    }
    load()
  }, [setProfileValue])

  async function onProfileSave(data: ProfileForm) {
    setSavingProfile(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          phone: data.phone || null,
          preferred_language: data.preferred_language,
        })
        .eq('id', profile?.id)

      if (error) {
        toast.error('Fehler beim Speichern')
        return
      }

      setLanguage(data.preferred_language as PreferredLanguage)
      toast.success(t('settings.profileUpdated'))
    } finally {
      setSavingProfile(false)
    }
  }

  async function onPasswordSave(data: PasswordForm) {
    setSavingPassword(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: data.new_password,
      })

      if (error) {
        toast.error('Fehler beim Ändern des Passworts')
        return
      }

      toast.success(t('settings.passwordUpdated'))
      resetPassword()
    } finally {
      setSavingPassword(false)
    }
  }

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-xl">
      <PageHeader
        title={t('settings.profile')}
        breadcrumbs={[
          { label: t('nav.settings'), href: '/settings' },
          { label: t('settings.profile') },
        ]}
      />

      {/* Avatar */}
      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-secondary text-lg">
                {profile ? getInitials(profile.full_name) : '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{profile?.full_name}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <Button variant="outline" size="sm" className="mt-2">
                <Camera className="h-4 w-4 mr-1" />
                {t('settings.avatar')} ändern
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">{t('settings.profile')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit(onProfileSave)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">{t('settings.fullName')} *</Label>
              <Input id="full_name" {...registerProfile('full_name')} />
              {profileErrors.full_name && (
                <p className="text-sm text-destructive">{profileErrors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('common.email')}</Label>
              <Input id="email" type="email" value={profile?.email ?? ''} disabled />
              <p className="text-xs text-muted-foreground">E-Mail kann nicht geändert werden</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t('settings.phone')}</Label>
              <Input id="phone" type="tel" {...registerProfile('phone')} placeholder="+49 ..." />
            </div>

            <div className="space-y-2">
              <Label>{t('settings.language')}</Label>
              <Select
                defaultValue={profile?.preferred_language ?? 'de'}
                onValueChange={(v) => setProfileValue('preferred_language', v as 'de' | 'en' | 'es')}
              >
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

            <Button type="submit" disabled={savingProfile}>
              {savingProfile && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('settings.saveProfile')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Password Form */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">{t('settings.changePassword')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit(onPasswordSave)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new_password">{t('settings.newPassword')} *</Label>
              <Input id="new_password" type="password" {...registerPassword('new_password')} />
              {passwordErrors.new_password && (
                <p className="text-sm text-destructive">{passwordErrors.new_password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">{t('settings.confirmPassword')} *</Label>
              <Input id="confirm_password" type="password" {...registerPassword('confirm_password')} />
              {passwordErrors.confirm_password && (
                <p className="text-sm text-destructive">{passwordErrors.confirm_password.message}</p>
              )}
            </div>

            <Button type="submit" variant="outline" disabled={savingPassword}>
              {savingPassword && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('settings.changePassword')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

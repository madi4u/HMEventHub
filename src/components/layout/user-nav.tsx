'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { LogOut, User, Settings, Globe } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/i18n'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import { getInitials, getRoleBadgeColor } from '@/lib/utils'
import type { Profile, PreferredLanguage } from '@/types'
import Link from 'next/link'

interface UserNavProps {
  profile: Profile
}

const languageLabels: Record<PreferredLanguage, string> = {
  de: '🇩🇪 Deutsch',
  en: '🇬🇧 English',
  es: '🇪🇸 Español',
}

export function UserNav({ profile }: UserNavProps) {
  const { t, setLanguage, language } = useTranslation()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success(t('auth.logout'))
    router.push('/login')
    router.refresh()
  }

  async function handleLanguageChange(lang: PreferredLanguage) {
    setLanguage(lang)
    // Persist to database
    const supabase = createClient()
    await supabase
      .from('profiles')
      .update({ preferred_language: lang })
      .eq('id', profile.id)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-3 w-full px-2 py-2 rounded-md hover:bg-sidebar-accent transition-colors text-left">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
              {getInitials(profile.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{profile.full_name}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{profile.email}</p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-1">
            <span className="font-medium">{profile.full_name}</span>
            <span className="text-xs text-muted-foreground font-normal">{profile.email}</span>
            <Badge className={`text-xs w-fit mt-1 ${getRoleBadgeColor(profile.role)}`} variant="outline">
              {t(`roles.${profile.role}`)}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings/profile" className="flex items-center gap-2 cursor-pointer">
            <User className="h-4 w-4" />
            {t('nav.profile')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
            <Settings className="h-4 w-4" />
            {t('nav.settings')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t('common.language')}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {(Object.keys(languageLabels) as PreferredLanguage[]).map((lang) => (
              <DropdownMenuItem
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                className={language === lang ? 'bg-accent' : ''}
              >
                {languageLabels[lang]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-destructive focus:text-destructive flex items-center gap-2 cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          {t('auth.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

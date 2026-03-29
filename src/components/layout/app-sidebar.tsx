'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  Package,
  ClipboardList,
  DollarSign,
  MessageSquare,
  BookOpen,
  Settings,
  Users,
  Truck,
  ShoppingBag,
  ShieldAlert,
  User,
  Building2,
} from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { UserNav } from './user-nav'
import { useTranslation } from '@/i18n'
import { cn, isManagerRole } from '@/lib/utils'
import type { Profile, UserRole } from '@/types'

interface AppSidebarProps {
  profile: Profile
}

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: UserRole[]
}

export function AppSidebar({ profile }: AppSidebarProps) {
  const { t } = useTranslation()
  const pathname = usePathname()
  const role = profile.role

  const adminNavItems: NavItem[] = [
    {
      title: t('nav.dashboard'),
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['SUPERADMIN', 'TENANT_ADMIN', 'OWNER', 'EVENT_MANAGER'],
    },
    {
      title: t('nav.events'),
      href: '/events',
      icon: CalendarDays,
      roles: ['SUPERADMIN', 'TENANT_ADMIN', 'OWNER', 'EVENT_MANAGER'],
    },
    {
      title: t('nav.users'),
      href: '/users',
      icon: Users,
      roles: ['SUPERADMIN', 'TENANT_ADMIN', 'OWNER'],
    },
    {
      title: t('nav.logistics'),
      href: '/logistics',
      icon: Truck,
      roles: ['SUPERADMIN', 'TENANT_ADMIN', 'OWNER', 'EVENT_MANAGER'],
    },
    {
      title: t('nav.products'),
      href: '/products',
      icon: ShoppingBag,
      roles: ['SUPERADMIN', 'TENANT_ADMIN', 'OWNER', 'EVENT_MANAGER'],
    },
    {
      title: t('nav.onboarding'),
      href: '/onboarding',
      icon: BookOpen,
      roles: ['SUPERADMIN', 'TENANT_ADMIN', 'OWNER', 'EVENT_MANAGER'],
    },
    {
      title: t('nav.settings'),
      href: '/settings',
      icon: Settings,
      roles: ['SUPERADMIN', 'TENANT_ADMIN', 'OWNER', 'EVENT_MANAGER'],
    },
  ]

  const superadminNavItems: NavItem[] = [
    {
      title: t('nav.superadmin'),
      href: '/superadmin',
      icon: ShieldAlert,
      roles: ['TENANT_ADMIN'],
    },
  ]

  const employeeNavItems: NavItem[] = [
    {
      title: t('nav.myEvents'),
      href: '/my-events',
      icon: CalendarDays,
      roles: ['EMPLOYEE', 'STANDLEITER', 'READ_ONLY'],
    },
    {
      title: t('nav.timeTracking'),
      href: '/time-tracking',
      icon: Clock,
      roles: ['EMPLOYEE', 'STANDLEITER'],
    },
    {
      title: t('nav.inventory'),
      href: '/inventory',
      icon: Package,
      roles: ['EMPLOYEE', 'STANDLEITER'],
    },
    {
      title: t('nav.checklists'),
      href: '/checklists',
      icon: ClipboardList,
      roles: ['EMPLOYEE', 'STANDLEITER'],
    },
    {
      title: t('nav.cashReport'),
      href: '/cash-reports',
      icon: DollarSign,
      roles: ['EMPLOYEE', 'STANDLEITER'],
    },
    {
      title: t('nav.feed'),
      href: '/feed',
      icon: MessageSquare,
      roles: ['EMPLOYEE', 'STANDLEITER'],
    },
    {
      title: t('nav.onboarding'),
      href: '/onboarding',
      icon: BookOpen,
      roles: ['EMPLOYEE', 'STANDLEITER', 'READ_ONLY'],
    },
    {
      title: t('nav.profile'),
      href: '/settings/profile',
      icon: User,
      roles: ['EMPLOYEE', 'STANDLEITER', 'READ_ONLY'],
    },
  ]

  const isManager = isManagerRole(role)
  const navItems = isManager ? adminNavItems : employeeNavItems
  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(role)
  )
  const visibleSuperadminItems = superadminNavItems.filter(
    (item) => !item.roles || item.roles.includes(role)
  )

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
        <Link href={isManager ? '/dashboard' : '/my-events'} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-sidebar-primary flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-sidebar-foreground text-sm">H+M EventHub</span>
            <span className="text-xs text-sidebar-foreground/60">Catering Management</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link href={item.href} className={cn(
                        'flex items-center gap-2',
                        isActive && 'text-sidebar-primary-foreground bg-sidebar-primary'
                      )}>
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {visibleSuperadminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>System</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleSuperadminItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                        <Link href={item.href} className={cn(
                          'flex items-center gap-2',
                          isActive && 'text-sidebar-primary-foreground bg-sidebar-primary'
                        )}>
                          <Icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <UserNav profile={profile} />
      </SidebarFooter>
    </Sidebar>
  )
}

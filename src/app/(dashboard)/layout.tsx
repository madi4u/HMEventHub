import { redirect } from 'next/navigation'
import { getSessionFromHeaders } from '@/lib/session'
import { db } from '@/lib/db'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { I18nProvider } from '@/i18n/provider'
import type { Profile } from '@/types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSessionFromHeaders()

  if (!session) {
    redirect('/login')
  }

  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('user_id', session.userId)
    .single()

  if (!profile) {
    redirect('/login')
  }

  const typedProfile = profile as unknown as Profile

  const { data: tenant } = await db
    .from('tenants')
    .select('name')
    .eq('id', typedProfile.tenant_id ?? '')
    .single()

  return (
    <I18nProvider initialLanguage={typedProfile.preferred_language} tenantName={(tenant as { name?: string } | null)?.name ?? ''}>
      <SidebarProvider>
        <AppSidebar profile={typedProfile} />
        <SidebarInset>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </I18nProvider>
  )
}

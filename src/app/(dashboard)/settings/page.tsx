import Link from 'next/link'
import { User, Lock, Globe, Bell } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const settingsSections = [
  {
    title: 'Profil',
    description: 'Name, Telefon und Profilbild verwalten',
    href: '/settings/profile',
    icon: User,
  },
  {
    title: 'Sicherheit',
    description: 'Passwort und Sitzungen verwalten',
    href: '/settings/security',
    icon: Lock,
  },
  {
    title: 'Sprache',
    description: 'Bevorzugte Sprache auswählen',
    href: '/settings/language',
    icon: Globe,
  },
]

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Einstellungen"
        breadcrumbs={[{ label: 'Einstellungen' }]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsSections.map((section) => {
          const Icon = section.icon
          return (
            <Link key={section.href} href={section.href}>
              <Card className="border-border hover:bg-accent/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{section.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{section.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

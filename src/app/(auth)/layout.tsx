import { I18nProvider } from '@/i18n/provider'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm leading-none">H+M</span>
              </div>
              <span className="text-2xl font-bold text-foreground">EventHub</span>
            </div>
            <p className="text-sm text-muted-foreground">Catering &amp; Foodtruck Management</p>
          </div>
          {children}
        </div>
      </div>
    </I18nProvider>
  )
}

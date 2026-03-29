import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { EventStatus, EventType, UserRole } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, locale: string = 'de-DE'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(date: string | Date, locale: string = 'de-DE'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTime(date: string | Date, locale: string = 'de-DE'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatCurrency(amount: number, currency: string = 'EUR', locale: string = 'de-DE'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

export function getDurationInMinutes(start: string, end: string | null): number {
  if (!end) {
    const now = new Date()
    const startDate = new Date(start)
    return Math.floor((now.getTime() - startDate.getTime()) / 1000 / 60)
  }
  const startDate = new Date(start)
  const endDate = new Date(end)
  return Math.floor((endDate.getTime() - startDate.getTime()) / 1000 / 60)
}

export function getRoleBadgeColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    SUPERADMIN: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    TENANT_ADMIN: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    OWNER: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    EVENT_MANAGER: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    STANDLEITER: 'bg-green-500/20 text-green-400 border-green-500/30',
    EMPLOYEE: 'bg-secondary text-secondary-foreground border-border',
    READ_ONLY: 'bg-muted text-muted-foreground border-border',
  }
  return colors[role] ?? 'bg-secondary text-secondary-foreground border-border'
}

export function getStatusBadgeColor(status: EventStatus | string): string {
  const colors: Record<string, string> = {
    DRAFT: 'bg-muted text-muted-foreground border-border',
    CONFIRMED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    ACTIVE: 'bg-green-500/20 text-green-400 border-green-500/30',
    COMPLETED: 'bg-secondary text-secondary-foreground border-border',
    CANCELLED: 'bg-destructive/20 text-red-400 border-destructive/30',
    OPEN: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    SUBMITTED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    FINAL: 'bg-green-500/20 text-green-400 border-green-500/30',
  }
  return colors[status] ?? 'bg-secondary text-secondary-foreground border-border'
}

export function getEventTypeLabel(type: EventType | string, lang: string = 'de'): string {
  const labels: Record<string, Record<EventType, string>> = {
    de: {
      FESTIVAL: 'Festival',
      CORPORATE: 'Firmenevent',
      PRIVATE: 'Privat',
      MARKET: 'Markt',
      CATERING: 'Catering',
      OTHER: 'Sonstige',
    },
    en: {
      FESTIVAL: 'Festival',
      CORPORATE: 'Corporate Event',
      PRIVATE: 'Private',
      MARKET: 'Market',
      CATERING: 'Catering',
      OTHER: 'Other',
    },
    es: {
      FESTIVAL: 'Festival',
      CORPORATE: 'Evento Corporativo',
      PRIVATE: 'Privado',
      MARKET: 'Mercado',
      CATERING: 'Catering',
      OTHER: 'Otro',
    },
  }
  const t = type as EventType
  return labels[lang]?.[t] ?? labels['de'][t] ?? type
}

export function getRoleLabel(role: UserRole, lang: string = 'de'): string {
  const labels: Record<string, Record<UserRole, string>> = {
    de: {
      SUPERADMIN: 'Superadmin',
      TENANT_ADMIN: 'Mandant-Admin',
      OWNER: 'Inhaber',
      EVENT_MANAGER: 'Veranstaltungsleiter',
      STANDLEITER: 'Standleiter',
      EMPLOYEE: 'Mitarbeiter',
      READ_ONLY: 'Lesezugriff',
    },
    en: {
      SUPERADMIN: 'Superadmin',
      TENANT_ADMIN: 'Tenant Admin',
      OWNER: 'Owner',
      EVENT_MANAGER: 'Event Manager',
      STANDLEITER: 'Stand Manager',
      EMPLOYEE: 'Employee',
      READ_ONLY: 'Read Only',
    },
    es: {
      SUPERADMIN: 'Superadmin',
      TENANT_ADMIN: 'Admin de Inquilino',
      OWNER: 'Propietario',
      EVENT_MANAGER: 'Gestor de Eventos',
      STANDLEITER: 'Jefe de Stand',
      EMPLOYEE: 'Empleado',
      READ_ONLY: 'Solo Lectura',
    },
  }
  return labels[lang]?.[role] ?? labels['de'][role] ?? role
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äöü]/g, (char) => ({ ä: 'ae', ö: 'oe', ü: 'ue' }[char] ?? char))
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function generateDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  const current = new Date(start)

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }

  return dates
}

export function isAdminRole(role: UserRole): boolean {
  return ['SUPERADMIN', 'TENANT_ADMIN', 'OWNER'].includes(role)
}

export function isManagerRole(role: UserRole): boolean {
  return ['SUPERADMIN', 'TENANT_ADMIN', 'OWNER', 'EVENT_MANAGER'].includes(role)
}

export function canAccessInternalData(role: UserRole): boolean {
  return isManagerRole(role)
}

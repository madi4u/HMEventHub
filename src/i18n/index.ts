'use client'

import { useContext } from 'react'
import { I18nContext } from './provider'
import type { PreferredLanguage } from '@/types'

// Re-export the translations for direct use
export { de } from './translations/de'
export { en } from './translations/en'
export { es } from './translations/es'

export type { PreferredLanguage }

// Interpolate variables in translation strings
function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? `{{${key}}}`))
}

// Deep get a value from nested object by dot-notation key
function getNestedValue(obj: Record<string, unknown>, key: string): string | undefined {
  const parts = key.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  if (typeof current === 'string') return current
  return undefined
}

export function useTranslation() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider')
  }

  const { translations, language, setLanguage, tenantName } = context

  function t(key: string, vars?: Record<string, string | number>): string {
    const value = getNestedValue(translations as unknown as Record<string, unknown>, key)
    if (value === undefined) {
      // Fallback: return the last part of the key
      const fallback = key.split('.').pop() ?? key
      return interpolate(fallback, vars)
    }
    return interpolate(value, vars)
  }

  return { t, language, setLanguage, tenantName }
}

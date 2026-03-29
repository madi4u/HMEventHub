'use client'

import React, { createContext, useState, useEffect, useCallback } from 'react'
import type { PreferredLanguage } from '@/types'
import { de } from './translations/de'
import { en } from './translations/en'
import { es } from './translations/es'

type Translations = typeof de

interface I18nContextType {
  language: PreferredLanguage
  setLanguage: (lang: PreferredLanguage) => void
  translations: Translations
  tenantName: string
}

export const I18nContext = createContext<I18nContextType | null>(null)

const translationMap: Record<PreferredLanguage, Translations> = {
  de,
  en: en as unknown as Translations,
  es: es as unknown as Translations,
}

const LANGUAGE_STORAGE_KEY = 'eventhub_language'

interface I18nProviderProps {
  children: React.ReactNode
  initialLanguage?: PreferredLanguage
  tenantName?: string
}

export function I18nProvider({ children, initialLanguage = 'de', tenantName = '' }: I18nProviderProps) {
  const [language, setLanguageState] = useState<PreferredLanguage>(initialLanguage)

  // On mount, check localStorage for saved preference
  useEffect(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as PreferredLanguage | null
    if (stored && ['de', 'en', 'es'].includes(stored)) {
      setLanguageState(stored)
    }
  }, [])

  const setLanguage = useCallback((lang: PreferredLanguage) => {
    setLanguageState(lang)
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
  }, [])

  const translations = translationMap[language] ?? de

  return (
    <I18nContext.Provider value={{ language, setLanguage, translations, tenantName }}>
      {children}
    </I18nContext.Provider>
  )
}

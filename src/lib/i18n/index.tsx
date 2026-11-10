import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react'
import type { SupportedLocale, I18nDictionary } from './types'
import { ptBR } from './pt-BR'
import { enUS } from './en-US'

interface I18nContextValue {
  locale: SupportedLocale
  setLocale: (locale: SupportedLocale) => void
  t: I18nDictionary
}

const dictionaries: Record<SupportedLocale, I18nDictionary> = {
  'pt-BR': ptBR,
  'en-US': enUS,
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[2]) : null
}

function detectInitialLocale(): SupportedLocale {
  if (typeof window === 'undefined') return 'pt-BR'

  try {
    const saved = localStorage.getItem('lang')
    if (saved === 'pt-BR' || saved === 'en-US') return saved

    const cookieLang = getCookie('lang')
    if (cookieLang === 'pt-BR' || cookieLang === 'en-US') return cookieLang

    const navLang = navigator.language || ''
    if (navLang.toLowerCase().startsWith('en')) return 'en-US'
  } catch {
    // Ignore storage errors in restricted contexts
  }

  return 'pt-BR'
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode
  initialLocale?: SupportedLocale
}) {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => initialLocale ?? detectInitialLocale())

  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale)
    try {
      localStorage.setItem('lang', newLocale)
      document.cookie = `lang=${newLocale}; path=/; max-age=31536000; SameSite=Lax`
      document.documentElement.lang = newLocale
    } catch {
      // Ignore storage errors
    }
  }

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const t = useMemo(() => dictionaries[locale], [locale])

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
    }),
    [locale, t],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

export type { SupportedLocale, I18nDictionary }
export { ptBR, enUS }

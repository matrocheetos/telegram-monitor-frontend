import { useI18n, type SupportedLocale } from '../../lib/i18n'

interface LanguageSwitcherProps {
  variant?: 'dark' | 'light'
}

export function LanguageSwitcher({ variant = 'light' }: LanguageSwitcherProps) {
  const { locale, setLocale } = useI18n()

  const isDark = variant === 'dark'

  const activeColor = isDark ? 'text-sky-400' : 'text-blue-600'
  const inactiveColor = isDark ? 'text-slate-400' : 'text-slate-500'
  const separatorColor = 'text-slate-500'

  const handleSelect = (lang: SupportedLocale) => {
    if (locale !== lang) {
      setLocale(lang)
    }
  }

  return (
    <div className="inline-flex items-center gap-1.5 text-[13px] select-none" role="group" aria-label="Language selection">
      <button
        type="button"
        onClick={() => handleSelect('pt-BR')}
        className={`cursor-pointer transition-colors ${
          locale === 'pt-BR'
            ? `${activeColor} font-bold`
            : `${inactiveColor} font-normal hover:text-slate-200`
        }`}
        aria-pressed={locale === 'pt-BR'}
      >
        PT
      </button>
      <span className={`${separatorColor} font-normal`} aria-hidden="true">
        |
      </span>
      <button
        type="button"
        onClick={() => handleSelect('en-US')}
        className={`cursor-pointer transition-colors ${
          locale === 'en-US'
            ? `${activeColor} font-bold`
            : `${inactiveColor} font-normal hover:text-slate-200`
        }`}
        aria-pressed={locale === 'en-US'}
      >
        EN
      </button>
    </div>
  )
}

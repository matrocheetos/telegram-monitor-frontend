import { LanguageSwitcher } from './LanguageSwitcher'
import { useI18n } from '../../lib/i18n'

interface AuthTopBarProps {
  brandLabel?: string
  isInitialSetup?: boolean
}

export function AuthTopBar({ brandLabel, isInitialSetup = false }: AuthTopBarProps) {
  const { t } = useI18n()

  const displayBrand = brandLabel ?? (isInitialSetup ? t.common.initialSetupBrand : t.common.appName)

  return (
    <header className="w-full bg-slate-900 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src="/logo-icon.png"
            alt=""
            width={28}
            height={28}
            className="w-7 h-7 object-contain shrink-0 select-none"
          />
          <span className="text-xs sm:text-[13px] font-bold text-slate-400 tracking-wider uppercase select-none truncate">
            {displayBrand}
          </span>
        </div>
        <div className="bg-[#1e293b] border border-slate-700 rounded-lg px-2.5 sm:px-3.5 py-1.5 flex items-center shadow-xs">
          <LanguageSwitcher variant="dark" />
        </div>
      </div>
    </header>
  )
}

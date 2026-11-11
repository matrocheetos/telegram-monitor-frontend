import type { ReactNode } from 'react'
import { LanguageSwitcher } from './LanguageSwitcher'

interface PageHeaderProps {
  title: string
  action?: ReactNode
}

export function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 mb-4 sm:mb-6 min-h-[44px]">
      <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight select-none">
        {title}
      </h1>
      <div className="flex items-center gap-3">
        {action}
        <div className="hidden lg:flex bg-white border border-slate-300 rounded-lg px-3.5 py-1.5 items-center shadow-xs">
          <LanguageSwitcher variant="light" />
        </div>
      </div>
    </div>
  )
}

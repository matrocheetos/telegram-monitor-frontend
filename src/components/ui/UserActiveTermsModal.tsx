import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ApiError } from '../../lib/api/client'
import { adminQueries } from '../../lib/api/queries'
import type { AdminUserDTO, UserInterestDTO } from '../../lib/api/types'
import { useI18n } from '../../lib/i18n'

export interface UserActiveTermsModalProps {
  isOpen: boolean
  user: AdminUserDTO | null
  onClose: () => void
}

export function UserActiveTermsModal({ isOpen, user, onClose }: UserActiveTermsModalProps) {
  const { t, locale } = useI18n()

  const {
    data: interests,
    isLoading,
    error,
  } = useQuery({
    ...adminQueries.userInterests(user?.id ?? 0),
    enabled: isOpen && user !== null,
  })

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !user) return null

  const activeCount = interests ? interests.length : user.activeInterestsCount

  const formatTargetPrice = (maxPrice: number | null) => {
    if (maxPrice === null) {
      return t.dashboard.noLimit
    }
    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: locale === 'pt-BR' ? 'BRL' : 'USD',
    }).format(maxPrice)
    return t.dashboard.upTo(formatted)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const renderExclusions = (negativeTokens: string[]) => {
    if (negativeTokens.length === 0) {
      return <span className="text-xs text-slate-500">{t.dashboard.freeTokensSynonyms}</span>
    }

    return (
      <span className="inline-flex items-center gap-1.5 flex-wrap">
        {negativeTokens.map((neg) => (
          <span
            key={neg}
            className="bg-red-50 border border-red-200 text-red-600 text-[11px] font-semibold px-2 py-0.5 rounded-md"
          >
            -{neg}
          </span>
        ))}
      </span>
    )
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-active-terms-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overscroll-contain overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[648px] bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 my-auto"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-700 select-none">
              {t.users.activeTermsModalBadge}
            </span>
            <h2
              id="user-active-terms-modal-title"
              className="text-lg sm:text-[20px] font-bold text-slate-900 tracking-tight leading-snug mt-0.5 tabular-nums truncate"
            >
              {t.users.activeTermsModalTitle(user.username, activeCount)}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="w-10 h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-400 font-medium">
            …
          </div>
        ) : error ? (
          <div
            role="alert"
            className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm font-semibold text-red-600"
          >
            {error instanceof ApiError ? error.message : t.apiErrors.genericError}
          </div>
        ) : !interests || interests.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-sm font-medium text-slate-500">
            {t.users.activeTermsEmpty}
          </div>
        ) : (
          <>
            {/* Mobile Stacked Cards (< md) */}
            <div className="md:hidden flex flex-col gap-2.5 max-h-[60dvh] overflow-y-auto pr-0.5">
              {interests.map((item: UserInterestDTO) => (
                <div
                  key={item.id}
                  className="bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[13px] font-bold text-slate-900 break-words">
                      {item.rawTerm}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 tabular-nums flex-shrink-0">
                      {formatTargetPrice(item.maxPrice)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>{renderExclusions(item.negativeTokens)}</div>
                    <span className="text-[11px] text-slate-500 tabular-nums">
                      {t.users.createdAtLabel(formatDate(item.createdAt))}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (>= md) */}
            <div className="hidden md:block border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none gap-3">
                <span className="flex-1 min-w-0">{t.dashboard.termHeader}</span>
                <span className="w-40">{t.dashboard.rulesHeader}</span>
                <span className="w-28">{t.dashboard.targetPriceHeader}</span>
                <span className="w-24 text-right">{t.users.colCreatedAt}</span>
              </div>

              <div className="divide-y divide-slate-100 max-h-[55dvh] overflow-y-auto">
                {interests.map((item: UserInterestDTO) => (
                  <div key={item.id} className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50/70">
                    <span className="flex-1 min-w-0 text-[13px] font-semibold text-slate-900 truncate" title={item.rawTerm}>
                      {item.rawTerm}
                    </span>
                    <div className="w-40">{renderExclusions(item.negativeTokens)}</div>
                    <span className="w-28 text-xs font-semibold text-emerald-700 tabular-nums">
                      {formatTargetPrice(item.maxPrice)}
                    </span>
                    <span className="w-24 text-right text-xs text-slate-500 tabular-nums">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full md:w-auto h-11 md:h-10 px-6 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>
  )
}

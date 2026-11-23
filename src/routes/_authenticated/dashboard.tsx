import { useState, useRef } from 'react'
import type { FormEvent } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  dashboardQueries,
  useAddInterestMutation,
  useDeleteInterestMutation,
} from '../../lib/api/queries'
import { PageHeader } from '../../components/layout/PageHeader'
import { CopyButton } from '../../components/ui/CopyButton'
import { EmptyState } from '../../components/ui/EmptyState'
import { NtfyInfoModal } from '../../components/ui/NtfyInfoModal'
import { useI18n } from '../../lib/i18n'
import { ApiError } from '../../lib/api/client'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardPage,
})

function DashboardPage() {
  const { t, locale } = useI18n()
  const { data, isLoading, error } = useQuery(dashboardQueries.data())

  const addInterestMutation = useAddInterestMutation()
  const deleteInterestMutation = useDeleteInterestMutation()

  const [term, setTerm] = useState('')
  const [excludedTerms, setExcludedTerms] = useState('')
  const [maxPriceInput, setMaxPriceInput] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [infoModalVariant, setInfoModalVariant] = useState<'product' | 'coupon' | null>(null)

  const termInputRef = useRef<HTMLInputElement>(null)
  const maxPriceInputRef = useRef<HTMLInputElement>(null)

  const username = data?.userTopic ? data.userTopic.split('/').pop() || 'user' : 'user'
  const userNormalizedTopic =
    data?.userNormalizedTopic ||
    (data?.userTopic ? data.userTopic.replace(/\//g, '-') : `promo-user-${username}`)
  const couponsNormalizedTopic =
    data?.couponsTopic ? data.couponsTopic.replace(/\//g, '-') : 'promo-cupom'

  const userPublicUrl = data?.userPublicUrl || ''
  const couponsPublicUrl = data?.couponsPublicUrl || ''
  const fallbackBaseUrl = userPublicUrl
    ? userPublicUrl.substring(0, userPublicUrl.lastIndexOf('/'))
    : couponsPublicUrl
      ? couponsPublicUrl.substring(0, couponsPublicUrl.lastIndexOf('/'))
      : ''
  const ntfyServerUrl = data?.ntfyBaseUrl || fallbackBaseUrl

  const handleAddInterest = (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const trimmedTerm = term.trim()
    if (!trimmedTerm) {
      termInputRef.current?.focus()
      return
    }

    let parsedMaxPrice: number | null = null
    if (maxPriceInput.trim()) {
      const normalizedPrice = maxPriceInput.replace(',', '.').trim()
      const val = parseFloat(normalizedPrice)
      if (isNaN(val) || val <= 0) {
        setFormError(t.apiErrors.unprocessable)
        maxPriceInputRef.current?.focus()
        return
      }
      parsedMaxPrice = Math.round(val * 100) / 100
    }

    const trimmedExclusions = excludedTerms.trim()

    addInterestMutation.mutate(
      {
        term: trimmedTerm,
        ...(trimmedExclusions ? { excludedTerms: trimmedExclusions } : {}),
        maxPrice: parsedMaxPrice,
      },
      {
        onSuccess: () => {
          setTerm('')
          setExcludedTerms('')
          setMaxPriceInput('')
        },
      },
    )
  }

  const handleDelete = (id: number) => {
    deleteInterestMutation.mutate(id)
  }

  const formatPrice = (maxPrice: number | null) => {
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
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString(locale, {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <PageHeader title={t.dashboard.title} />

      {error && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm font-semibold text-red-600">
          {error instanceof ApiError ? error.message : t.apiErrors.genericError}
        </div>
      )}

      {/* Ntfy Channel Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        {/* User Notifications Channel Card */}
        <div className="bg-white border-2 border-blue-200 rounded-xl p-5 shadow-xs flex flex-col justify-between gap-3.5">
          <div className="flex items-start justify-between gap-3 min-w-0">
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-blue-700 tracking-wider uppercase select-none">
                {t.dashboard.notificationChannel}
              </span>
              <span
                className="text-[20px] sm:text-[22px] font-bold text-slate-900 tracking-tight truncate mt-1"
                translate="no"
              >
                {data?.userTopic || 'promo/user/…'}
              </span>
              <span
                className="text-[12px] text-slate-600 font-normal truncate mt-0.5"
                title={ntfyServerUrl}
              >
                {t.dashboard.serverLabel}{' '}
                <span translate="no">{ntfyServerUrl || 'https://…'}</span>
              </span>
            </div>

            {/* Info Button for Mobile (top-right) */}
            <button
              type="button"
              onClick={() => setInfoModalVariant('product')}
              className="lg:hidden w-9 h-9 rounded-lg bg-[#eff6ff] hover:bg-blue-100 active:bg-blue-200 border border-[#93c5fd] text-[#1d4ed8] flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
              aria-label={t.aria.ntfyInfoButton}
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="7.5" r="1.2" fill="currentColor" />
                <path d="M12 11v6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="flex flex-wrap lg:flex-nowrap lg:items-center gap-2 lg:gap-2.5 flex-shrink-0">
            {/* Info Button for Desktop */}
            <button
              type="button"
              onClick={() => setInfoModalVariant('product')}
              className="hidden lg:flex w-9 h-9 rounded-lg bg-[#eff6ff] hover:bg-blue-100 active:bg-blue-200 border border-[#93c5fd] text-[#1d4ed8] items-center justify-center transition-colors cursor-pointer flex-shrink-0 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
              aria-label={t.aria.ntfyInfoButton}
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="7.5" r="1.2" fill="currentColor" />
                <path d="M12 11v6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>

            <CopyButton
              text={userNormalizedTopic}
              label={t.common.copyTopic}
              copiedLabel={t.common.topicCopied}
              variant="blue-outline"
              compact
              className="h-11 sm:h-10 flex-1 min-w-fit lg:flex-initial touch-manipulation whitespace-nowrap"
            />
            <CopyButton
              text={ntfyServerUrl}
              label={t.common.copyServerUrl}
              copiedLabel={t.common.serverUrlCopied}
              variant="blue"
              compact
              className="h-11 sm:h-10 flex-1 min-w-fit lg:flex-initial touch-manipulation whitespace-nowrap"
            />
          </div>
        </div>

        {/* Global Coupons Channel Card */}
        <div className="bg-white border-2 border-emerald-300 rounded-xl p-5 shadow-xs flex flex-col justify-between gap-3.5">
          <div className="flex items-start justify-between gap-3 min-w-0">
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-emerald-700 tracking-wider uppercase select-none">
                {t.dashboard.couponsChannel}
              </span>
              <span
                className="text-[20px] sm:text-[22px] font-bold text-slate-900 tracking-tight truncate mt-1"
                translate="no"
              >
                {data?.couponsTopic || 'promo/cupom'}
              </span>
              <span
                className="text-[12px] text-slate-600 font-normal truncate mt-0.5"
                title={ntfyServerUrl}
              >
                {t.dashboard.serverLabel}{' '}
                <span translate="no">{ntfyServerUrl || 'https://…'}</span>
              </span>
            </div>

            {/* Info Button for Mobile (top-right) */}
            <button
              type="button"
              onClick={() => setInfoModalVariant('coupon')}
              className="lg:hidden w-9 h-9 rounded-lg bg-[#f0fdf4] hover:bg-emerald-100 active:bg-emerald-200 border border-[#86efac] text-[#15803d] flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
              aria-label={t.aria.ntfyInfoButton}
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="7.5" r="1.2" fill="currentColor" />
                <path d="M12 11v6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="flex flex-wrap lg:flex-nowrap lg:items-center gap-2 lg:gap-2.5 flex-shrink-0">
            {/* Info Button for Desktop */}
            <button
              type="button"
              onClick={() => setInfoModalVariant('coupon')}
              className="hidden lg:flex w-9 h-9 rounded-lg bg-[#f0fdf4] hover:bg-emerald-100 active:bg-emerald-200 border border-[#86efac] text-[#15803d] items-center justify-center transition-colors cursor-pointer flex-shrink-0 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
              aria-label={t.aria.ntfyInfoButton}
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="7.5" r="1.2" fill="currentColor" />
                <path d="M12 11v6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </button>

            <CopyButton
              text={couponsNormalizedTopic}
              label={t.common.copyTopic}
              copiedLabel={t.common.topicCopied}
              variant="green-outline"
              compact
              className="h-11 sm:h-10 flex-1 min-w-fit lg:flex-initial touch-manipulation whitespace-nowrap"
            />
            <CopyButton
              text={ntfyServerUrl}
              label={t.common.copyServerUrl}
              copiedLabel={t.common.serverUrlCopied}
              variant="green"
              compact
              className="h-11 sm:h-10 flex-1 min-w-fit lg:flex-initial touch-manipulation whitespace-nowrap"
            />
          </div>
        </div>
      </div>

      {/* Add Interest Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-xs">
        <h2 className="text-[15px] sm:text-base font-bold text-slate-900 mb-3.5 sm:mb-4 select-none">
          {t.dashboard.addInterestTitle}
        </h2>

        {formError && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-semibold"
          >
            {formError}
          </div>
        )}

        {addInterestMutation.error && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-semibold"
          >
            {addInterestMutation.error instanceof ApiError
              ? addInterestMutation.error.message
              : t.apiErrors.genericError}
          </div>
        )}

        <form
          onSubmit={handleAddInterest}
          className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_180px_auto] gap-3.5 items-end"
        >
          <div className="flex flex-col gap-1.5 min-w-0">
            <label htmlFor="interest-term" className="text-xs font-semibold text-slate-700">
              {t.dashboard.termFieldLabel}{' '}
              <span className="text-red-600" aria-hidden="true">
                *
              </span>
            </label>
            <input
              ref={termInputRef}
              id="interest-term"
              name="term"
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={t.dashboard.termPlaceholder}
              required
              autoComplete="off"
              spellCheck={false}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-lg text-base sm:text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5 min-w-0">
            <label htmlFor="interest-exclusions" className="text-xs font-semibold text-slate-700">
              {t.dashboard.exclusionsFieldLabel}
            </label>
            <input
              id="interest-exclusions"
              name="excludedTerms"
              type="text"
              value={excludedTerms}
              onChange={(e) => setExcludedTerms(e.target.value)}
              placeholder={t.dashboard.exclusionsPlaceholder}
              autoComplete="off"
              spellCheck={false}
              className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-lg text-base sm:text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5 min-w-0">
            <label htmlFor="interest-max-price" className="text-xs font-semibold text-slate-700">
              {t.dashboard.maxPriceFieldLabel}
            </label>
            <div className="w-full h-11 px-3 bg-slate-50 border border-slate-300 rounded-lg flex items-center gap-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-colors">
              <span aria-hidden="true" className="text-sm font-semibold text-slate-500 select-none">
                {t.dashboard.currencyPrefix}
              </span>
              <input
                ref={maxPriceInputRef}
                id="interest-max-price"
                name="maxPrice"
                type="text"
                value={maxPriceInput}
                onChange={(e) => setMaxPriceInput(e.target.value)}
                placeholder={t.dashboard.maxPricePlaceholder}
                inputMode="decimal"
                autoComplete="off"
                spellCheck={false}
                className="w-full h-full bg-transparent text-base sm:text-sm text-slate-900 tabular-nums focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={addInterestMutation.isPending}
            className="w-full lg:w-auto h-11 px-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer touch-manipulation disabled:opacity-50 whitespace-nowrap shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            {addInterestMutation.isPending ? '…' : t.dashboard.addInterestButton}
          </button>
        </form>
      </div>

      {/* Monitored Terms Section */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 font-medium">
          …
        </div>
      ) : !data || data.interests.length === 0 ? (
        <EmptyState type="interests" />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-3 sm:mb-4 select-none tabular-nums">
            {t.dashboard.monitoredTermsTitle(data.interests.length)}
          </h2>

          {/* Mobile Card List (< md) */}
          <div className="md:hidden divide-y divide-slate-100">
            {data.interests.map((item) => (
              <div key={item.id} className="py-3 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[13px] font-bold text-slate-900 truncate">
                    {item.rawTerm}
                  </span>
                  <span
                    className={`text-xs font-bold tabular-nums flex-shrink-0 ${
                      item.maxPrice !== null ? 'text-emerald-700' : 'text-slate-500 font-normal'
                    }`}
                  >
                    {formatPrice(item.maxPrice)}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500">
                  {item.negativeTokens.length > 0 ? (
                    <span className="flex items-center gap-1 flex-wrap">
                      <span className="font-medium text-slate-600">{t.dashboard.exclusionLabel}</span>
                      {item.negativeTokens.map((neg) => (
                        <span
                          key={neg}
                          className="bg-red-50 border border-red-200 text-red-700 text-[10px] font-medium px-1.5 py-0.5 rounded"
                        >
                          -{neg}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="text-slate-400">{t.dashboard.freeTokensSynonyms}</span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400 tabular-nums">
                    {formatDate(item.createdAt)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    disabled={deleteInterestMutation.isPending}
                    className="h-9 px-3 bg-red-50 hover:bg-red-100 active:bg-red-200 text-red-700 text-xs font-semibold rounded-lg flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  >
                    {t.common.remove}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (>= md) */}
          <div className="hidden md:block">
            <div className="bg-slate-100 border border-slate-200 rounded-lg px-4 py-2.5 mb-2 flex items-center text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
              <span className="flex-1">{t.dashboard.termHeader}</span>
              <span className="w-72 text-left hidden sm:inline-block">{t.dashboard.rulesHeader}</span>
              <span className="w-36 text-center">{t.dashboard.targetPriceHeader}</span>
              <span className="w-36 text-center hidden md:inline-block">{t.dashboard.lastAlertHeader}</span>
              <span className="w-20 text-right">{t.dashboard.actionHeader}</span>
            </div>

            <div className="divide-y divide-slate-100">
              {data.interests.map((item) => (
                <div
                  key={item.id}
                  className="py-3.5 px-4 flex items-center hover:bg-slate-50/70 transition-colors rounded-lg"
                >
                  <div className="flex-1 flex flex-col pr-4 min-w-0">
                    <span className="text-sm font-semibold text-slate-900 truncate">
                      {item.rawTerm}
                    </span>
                    {item.negativeTokens.length > 0 && (
                      <span className="text-xs text-slate-500 sm:hidden">
                        {item.negativeTokens.map((t) => `-${t}`).join(' ')}
                      </span>
                    )}
                  </div>

                  <div className="w-72 text-left hidden sm:flex items-center gap-1.5 flex-wrap">
                    {item.negativeTokens.length > 0 ? (
                      item.negativeTokens.map((neg) => (
                        <span
                          key={neg}
                          className="bg-red-50 border border-red-200 text-red-700 text-[11px] font-medium px-2 py-0.5 rounded-md"
                        >
                          -{neg}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 font-normal">
                        {t.dashboard.freeTokensSynonyms}
                      </span>
                    )}
                  </div>

                  <div className="w-36 text-center">
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        item.maxPrice !== null ? 'text-emerald-700 font-bold' : 'text-slate-500 font-normal'
                      }`}
                    >
                      {formatPrice(item.maxPrice)}
                    </span>
                  </div>

                  <div className="w-36 text-center hidden md:block text-xs text-slate-400 tabular-nums">
                    {formatDate(item.createdAt)}
                  </div>

                  <div className="w-20 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={deleteInterestMutation.isPending}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-1 rounded-xs"
                    >
                      {t.common.remove}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {infoModalVariant && (
        <NtfyInfoModal
          isOpen={true}
          onClose={() => setInfoModalVariant(null)}
          variant={infoModalVariant}
          username={username}
          topic={infoModalVariant === 'product' ? userNormalizedTopic : couponsNormalizedTopic}
          publicUrl={infoModalVariant === 'product' ? userPublicUrl : couponsPublicUrl}
          ntfyBaseUrl={ntfyServerUrl || undefined}
          otherTopic={infoModalVariant === 'product' ? couponsNormalizedTopic : userNormalizedTopic}
        />
      )}
    </div>
  )
}

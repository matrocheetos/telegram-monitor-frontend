import { useState } from 'react'
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
  const [maxPriceInput, setMaxPriceInput] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  const handleAddInterest = (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)

    const trimmedTerm = term.trim()
    if (!trimmedTerm) {
      return
    }

    let parsedMaxPrice: number | null = null
    if (maxPriceInput.trim()) {
      const normalizedPrice = maxPriceInput.replace(',', '.').trim()
      const val = parseFloat(normalizedPrice)
      if (isNaN(val) || val <= 0) {
        setFormError(t.apiErrors.unprocessable)
        return
      }
      parsedMaxPrice = Math.round(val * 100) / 100
    }

    addInterestMutation.mutate(
      { term: trimmedTerm, maxPrice: parsedMaxPrice },
      {
        onSuccess: () => {
          setTerm('')
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* User Notifications Channel Card */}
        <div className="bg-white border-2 border-blue-200 rounded-xl p-6 shadow-xs flex items-center justify-between gap-4">
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-blue-700 tracking-wider uppercase select-none">
              {t.dashboard.notificationChannel}
            </span>
            <span className="text-[22px] font-bold text-slate-900 tracking-tight truncate mt-1">
              {data?.userTopic || 'promo/user/...'}
            </span>
            <span className="text-[13px] text-slate-600 font-normal truncate mt-0.5" title={data?.userPublicUrl}>
              {data?.userPublicUrl || 'https://...'}
            </span>
          </div>
          {data?.userPublicUrl && (
            <CopyButton text={data.userPublicUrl} label={t.common.copyUrl} variant="blue" />
          )}
        </div>

        {/* Global Coupons Channel Card */}
        <div className="bg-white border-2 border-emerald-300 rounded-xl p-6 shadow-xs flex items-center justify-between gap-4">
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-emerald-700 tracking-wider uppercase select-none">
              {t.dashboard.couponsChannel}
            </span>
            <span className="text-[22px] font-bold text-slate-900 tracking-tight truncate mt-1">
              {data?.couponsTopic || 'promo/cupom'}
            </span>
            <span className="text-[13px] text-slate-600 font-normal truncate mt-0.5" title={data?.couponsPublicUrl}>
              {data?.couponsPublicUrl || 'https://...'}
            </span>
          </div>
          {data?.couponsPublicUrl && (
            <CopyButton
              text={data.couponsPublicUrl}
              label={t.common.copyUrl}
              variant="blue"
              className="!bg-emerald-50 !border-emerald-300 !text-emerald-800 hover:!bg-emerald-100"
            />
          )}
        </div>
      </div>

      {/* Add Interest Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-4 select-none">
          {t.dashboard.addInterestTitle}
        </h2>

        {formError && (
          <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-semibold">
            {formError}
          </div>
        )}

        {addInterestMutation.error && (
          <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-semibold">
            {addInterestMutation.error instanceof ApiError
              ? addInterestMutation.error.message
              : t.apiErrors.genericError}
          </div>
        )}

        <form onSubmit={handleAddInterest} className="flex flex-col md:flex-row gap-3 items-center">
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={t.dashboard.termPlaceholder}
            required
            className="flex-1 w-full h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          <input
            type="text"
            value={maxPriceInput}
            onChange={(e) => setMaxPriceInput(e.target.value)}
            placeholder={t.dashboard.maxPricePlaceholder}
            className="w-full md:w-56 h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          <button
            type="submit"
            disabled={addInterestMutation.isPending}
            className="w-full md:w-auto h-11 px-5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-lg transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-xs"
          >
            {addInterestMutation.isPending ? '...' : t.dashboard.addInterestButton}
          </button>
        </form>
      </div>

      {/* Monitored Terms Section */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 font-medium">
          ...
        </div>
      ) : !data || data.interests.length === 0 ? (
        <EmptyState type="interests" />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4 select-none">
            {t.dashboard.monitoredTermsTitle(data.interests.length)}
          </h2>

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
                    className={`text-sm font-semibold ${
                      item.maxPrice !== null ? 'text-emerald-700 font-bold' : 'text-slate-500 font-normal'
                    }`}
                  >
                    {formatPrice(item.maxPrice)}
                  </span>
                </div>

                <div className="w-36 text-center hidden md:block text-xs text-slate-400">
                  {formatDate(item.createdAt)}
                </div>

                <div className="w-20 text-right">
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    disabled={deleteInterestMutation.isPending}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline cursor-pointer disabled:opacity-50"
                  >
                    {t.common.remove}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

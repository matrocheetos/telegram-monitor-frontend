import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { offersQueries } from '../../lib/api/queries'
import { PageHeader } from '../../components/layout/PageHeader'
import { CopyButton } from '../../components/ui/CopyButton'
import { EmptyState } from '../../components/ui/EmptyState'
import { useI18n } from '../../lib/i18n'
import { ApiError } from '../../lib/api/client'

interface OffersSearch {
  tab?: 'products' | 'coupons'
  q?: string
}

export const Route = createFileRoute('/_authenticated/offers')({
  validateSearch: (search: Record<string, unknown>): OffersSearch => {
    return {
      tab: (search.tab as 'products' | 'coupons') || undefined,
      q: (search.q as string) || undefined,
    }
  },
  component: OffersPage,
})

function OffersPage() {
  const { t, locale } = useI18n()
  const search = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const activeTab: 'products' | 'coupons' = search.tab === 'coupons' ? 'coupons' : 'products'
  const [queryInput, setQueryInput] = useState(search.q || '')

  useEffect(() => {
    setQueryInput(search.q || '')
  }, [search.q])

  const { data, isLoading, error } = useQuery(
    offersQueries.list({
      tab: activeTab,
      q: search.q,
    }),
  )

  const handleTabChange = (tab: 'products' | 'coupons') => {
    navigate({
      search: (prev) => ({
        ...prev,
        tab: tab === 'products' ? undefined : 'coupons',
      }),
    })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate({
      search: (prev) => ({
        ...prev,
        q: queryInput.trim() || undefined,
      }),
    })
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

  const productsCount = data?.productsCount ?? 0
  const couponsCount = data?.couponsCount ?? 0

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <PageHeader title={t.offers.title} />

      {error && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm font-semibold text-red-600">
          {error instanceof ApiError ? error.message : t.apiErrors.genericError}
        </div>
      )}

      {/* Tabs and Search Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Tabs Group */}
        <div className="inline-flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'products'}
            onClick={() => handleTabChange('products')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer select-none ${
              activeTab === 'products'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            {t.offers.tabProducts(productsCount)}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'coupons'}
            onClick={() => handleTabChange('coupons')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer select-none ${
              activeTab === 'coupons'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            {t.offers.tabCoupons(couponsCount)}
          </button>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex-1 md:max-w-md">
          <div className="relative">
            <input
              type="search"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder={t.offers.searchPlaceholder}
              className="w-full h-11 pl-4 pr-10 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors shadow-xs"
            />
            {queryInput && (
              <button
                type="button"
                onClick={() => {
                  setQueryInput('')
                  navigate({ search: (prev) => ({ ...prev, q: undefined }) })
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 font-medium">
          ...
        </div>
      ) : activeTab === 'products' ? (
        !data || data.products.length === 0 ? (
          <EmptyState type="products" />
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-4 select-none">
              {t.offers.productsTitle}
            </h2>

            <div className="bg-slate-100 border border-slate-200 rounded-lg px-4 py-2.5 mb-2 flex items-center text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
              <span className="flex-1">{t.offers.colOffer}</span>
              <span className="w-36 text-left hidden sm:inline-block">{t.offers.colTerm}</span>
              <span className="w-36 text-left hidden md:inline-block">{t.common.channel}</span>
              <span className="w-28 text-right">{t.offers.colPrice}</span>
              <span className="w-32 text-center hidden lg:inline-block">{t.common.date}</span>
              <span className="w-24 text-right">{t.common.action}</span>
            </div>

            <div className="divide-y divide-slate-100">
              {data.products.map((item) => (
                <div
                  key={item.id}
                  className="py-3.5 px-4 flex items-center hover:bg-slate-50/70 transition-colors rounded-lg gap-2"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm text-slate-900 font-medium line-clamp-2" title={item.messageText}>
                      {item.messageText}
                    </p>
                  </div>

                  <div className="w-36 text-left hidden sm:block">
                    <span className="inline-block bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-xs px-2.5 py-0.5 rounded-md truncate max-w-full">
                      {item.interestTerm}
                    </span>
                  </div>

                  <div className="w-36 text-left hidden md:block text-xs text-slate-600 font-normal truncate">
                    {item.channelDisplay}
                  </div>

                  <div className="w-28 text-right">
                    <span className="text-sm font-bold text-emerald-700 whitespace-nowrap">
                      {item.formattedPrice || (item.extractedPrice ? `R$ ${item.extractedPrice.toFixed(2)}` : '-')}
                    </span>
                  </div>

                  <div className="w-32 text-center hidden lg:block text-xs text-slate-400">
                    {formatDate(item.createdAt)}
                  </div>

                  <div className="w-24 text-right">
                    {item.offerUrl ? (
                      <a
                        href={item.offerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-blue-700 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        {t.offers.openLink}
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ) : !data || data.coupons.length === 0 ? (
        <EmptyState type="coupons" />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4 select-none">
            {t.offers.couponsTitle}
          </h2>

          <div className="bg-slate-100 border border-slate-200 rounded-lg px-4 py-2.5 mb-2 flex items-center text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
            <span className="w-48 text-left">{t.offers.colCouponCode}</span>
            <span className="w-32 text-left hidden sm:inline-block">{t.common.store}</span>
            <span className="flex-1 text-left hidden md:inline-block">{t.offers.colRuleMessage}</span>
            <span className="w-36 text-left hidden lg:inline-block">{t.common.channel}</span>
            <span className="w-32 text-center hidden xl:inline-block">{t.common.date}</span>
            <span className="w-32 text-right">{t.common.action}</span>
          </div>

          <div className="divide-y divide-slate-100">
            {data.coupons.map((item) => (
              <div
                key={item.id}
                className="py-3.5 px-4 flex items-center hover:bg-slate-50/70 transition-colors rounded-lg gap-2"
              >
                <div className="w-48 text-left">
                  <span className="inline-block bg-emerald-50 border border-emerald-300 text-emerald-800 font-mono font-bold text-xs px-2.5 py-1 rounded-md tracking-wider">
                    {item.code}
                  </span>
                </div>

                <div className="w-32 text-left hidden sm:block">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {item.storeName || '-'}
                  </span>
                </div>

                <div className="flex-1 min-w-0 pr-4 hidden md:block">
                  <p className="text-xs text-slate-600 truncate" title={item.messageText}>
                    {item.messageText}
                  </p>
                </div>

                <div className="w-36 text-left hidden lg:block text-xs text-slate-600 truncate">
                  {item.channelDisplay}
                </div>

                <div className="w-32 text-center hidden xl:block text-xs text-slate-400">
                  {formatDate(item.createdAt)}
                </div>

                <div className="w-32 text-right">
                  <CopyButton
                    text={item.code}
                    label={t.common.copyCoupon}
                    variant="green"
                    className="!text-xs !py-1.5 !px-3"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

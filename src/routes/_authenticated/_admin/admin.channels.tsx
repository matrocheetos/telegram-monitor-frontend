import { useState, useMemo, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  adminQueries,
  useSyncChannelsMutation,
  useUpdateChannelsMutation,
} from '../../../lib/api/queries'
import { PageHeader } from '../../../components/layout/PageHeader'
import { EmptyState } from '../../../components/ui/EmptyState'
import { useI18n } from '../../../lib/i18n'
import { ApiError } from '../../../lib/api/client'
import type { TelegramChannelDTO, UpdateChannelItem } from '../../../lib/api/types'

export const Route = createFileRoute('/_authenticated/_admin/admin/channels')({
  component: AdminChannelsPage,
})

function AdminChannelsPage() {
  const { t } = useI18n()
  const { data, isLoading, error } = useQuery(adminQueries.channels())

  const syncChannelsMutation = useSyncChannelsMutation()
  const updateChannelsMutation = useUpdateChannelsMutation()

  const [searchFilter, setSearchFilter] = useState('')
  const [channelOverrides, setChannelOverrides] = useState<Record<number, { monitorProducts: boolean; monitorCoupons: boolean }>>({})
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Initialize/reset overrides when fresh data loads
  useEffect(() => {
    if (data?.channels) {
      const initial: Record<number, { monitorProducts: boolean; monitorCoupons: boolean }> = {}
      for (const ch of data.channels) {
        initial[ch.chatId] = {
          monitorProducts: ch.monitorProducts,
          monitorCoupons: ch.monitorCoupons,
        }
      }
      setChannelOverrides(initial)
    }
  }, [data?.channels])

  const toggleProducts = (chatId: number) => {
    setChannelOverrides((prev) => {
      const current = prev[chatId] ?? { monitorProducts: false, monitorCoupons: false }
      return {
        ...prev,
        [chatId]: {
          ...current,
          monitorProducts: !current.monitorProducts,
        },
      }
    })
    setSaveSuccess(false)
  }

  const toggleCoupons = (chatId: number) => {
    setChannelOverrides((prev) => {
      const current = prev[chatId] ?? { monitorProducts: false, monitorCoupons: false }
      return {
        ...prev,
        [chatId]: {
          ...current,
          monitorCoupons: !current.monitorCoupons,
        },
      }
    })
    setSaveSuccess(false)
  }

  // Filter channels locally
  const filteredChannels = useMemo(() => {
    if (!data?.channels) return []
    const q = searchFilter.trim().toLowerCase()
    if (!q) return data.channels

    return data.channels.filter((ch) => {
      const titleMatch = ch.title.toLowerCase().includes(q)
      const usernameMatch = ch.username.toLowerCase().includes(q)
      const idMatch = ch.chatId.toString().includes(q)
      return titleMatch || usernameMatch || idMatch
    })
  }, [data?.channels, searchFilter])

  // Count active channels based on current overrides
  const activeProductsCount = useMemo(() => {
    if (!data?.channels) return 0
    return data.channels.filter((ch) => channelOverrides[ch.chatId]?.monitorProducts ?? ch.monitorProducts).length
  }, [data?.channels, channelOverrides])

  const activeCouponsCount = useMemo(() => {
    if (!data?.channels) return 0
    return data.channels.filter((ch) => channelOverrides[ch.chatId]?.monitorCoupons ?? ch.monitorCoupons).length
  }, [data?.channels, channelOverrides])

  // Check if there are unsaved changes
  const hasChanges = useMemo(() => {
    if (!data?.channels) return false
    return data.channels.some((ch) => {
      const override = channelOverrides[ch.chatId]
      if (!override) return false
      return override.monitorProducts !== ch.monitorProducts || override.monitorCoupons !== ch.monitorCoupons
    })
  }, [data?.channels, channelOverrides])

  const handleSaveChanges = () => {
    if (!data?.channels) return

    const updatePayload: UpdateChannelItem[] = data.channels.map((ch) => {
      const override = channelOverrides[ch.chatId]
      return {
        chatId: ch.chatId,
        monitorProducts: override?.monitorProducts ?? ch.monitorProducts,
        monitorCoupons: override?.monitorCoupons ?? ch.monitorCoupons,
      }
    })

    updateChannelsMutation.mutate(
      { channels: updatePayload },
      {
        onSuccess: () => {
          setSaveSuccess(true)
          setTimeout(() => setSaveSuccess(false), 3000)
        },
      },
    )
  }

  const handleSync = () => {
    syncChannelsMutation.mutate()
  }

  const renderSaveButton = (layoutClass: string) => (
    <button
      type="button"
      onClick={handleSaveChanges}
      disabled={!hasChanges || updateChannelsMutation.isPending}
      className={`h-11 sm:h-10 font-bold text-xs rounded-lg transition-colors cursor-pointer select-none shadow-xs flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${layoutClass} ${
        hasChanges
          ? 'bg-blue-600 hover:bg-blue-700 text-white'
          : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
      }`}
    >
      {updateChannelsMutation.isPending
        ? '…'
        : saveSuccess
          ? t.common.saveChanges + ' ✓'
          : t.channels.saveButton}
    </button>
  )

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <PageHeader title={t.channels.title} />

      {error && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm font-semibold text-red-600">
          {error instanceof ApiError ? error.message : t.apiErrors.genericError}
        </div>
      )}

      {/* KPI Summary Row (Board 5) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {/* KPI 1 - Account */}
        <div className="bg-white border-2 border-emerald-300 rounded-xl p-3 sm:p-5 shadow-xs flex flex-col min-w-0">
          <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 tracking-wider uppercase select-none mb-1 truncate">
            {t.channels.kpiAccount}
          </span>
          <span className="text-sm sm:text-xl font-bold text-slate-900 tracking-tight truncate tabular-nums">
            {data?.phoneMasked || '-'}
          </span>
          <span className="text-[10px] sm:text-xs text-slate-500 mt-1 tabular-nums truncate">
            {t.telegram.syncedChannels(data?.totalChannelsCount ?? 0)}
          </span>
        </div>

        {/* KPI 2 - Coupons */}
        <div className="bg-white border-2 border-amber-300 rounded-xl p-3 sm:p-5 shadow-xs flex flex-col min-w-0">
          <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 tracking-wider uppercase select-none mb-1 truncate">
            {t.channels.kpiCoupons}
          </span>
          <span className="text-sm sm:text-xl font-bold text-slate-900 tracking-tight truncate">
            {data?.couponsTopic || 'promo/cupom'}
          </span>
          <span className="text-[10px] sm:text-xs text-slate-500 mt-1 tabular-nums truncate">
            {t.channels.kpiCouponsDesc(activeCouponsCount)}
          </span>
        </div>

        {/* KPI 3 - Products */}
        <div className="bg-white border-2 border-blue-300 rounded-xl p-3 sm:p-5 shadow-xs flex flex-col min-w-0">
          <span className="text-[10px] sm:text-[11px] font-bold text-blue-700 tracking-wider uppercase select-none mb-1 truncate">
            {t.channels.kpiProducts}
          </span>
          <span className="text-sm sm:text-xl font-bold text-slate-900 tracking-tight truncate">
            {data?.adminProductTopic || 'promo/user/…'}
          </span>
          <span className="text-[10px] sm:text-xs text-slate-500 mt-1 tabular-nums truncate">
            {t.channels.kpiProductsDesc(activeProductsCount)}
          </span>
        </div>
      </div>

      {/* Channels Table Card */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 font-medium">
          …
        </div>
      ) : !data || data.channels.length === 0 ? (
        <EmptyState
          type="channels"
          onSyncChannels={handleSync}
          isSyncingChannels={syncChannelsMutation.isPending}
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-xs flex flex-col gap-4">
          {/* Toolbar Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <input
              id="channel-search"
              name="q"
              type="search"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder={t.channels.searchPlaceholder}
              autoComplete="off"
              spellCheck={false}
              className="w-full sm:w-72 h-11 sm:h-10 px-3.5 bg-slate-50 border border-slate-300 rounded-lg text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-colors"
            />

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSync}
                disabled={syncChannelsMutation.isPending}
                className="h-11 sm:h-10 px-3 sm:px-4 bg-blue-50 border border-blue-300 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg transition-colors cursor-pointer select-none disabled:opacity-50 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
              >
                {syncChannelsMutation.isPending ? '…' : t.channels.syncButton}
              </button>

              {renderSaveButton('px-3 sm:px-4')}
            </div>
          </div>

          {/* Mobile Channels Card List (< md) */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredChannels.map((ch: TelegramChannelDTO) => {
              const current = channelOverrides[ch.chatId] ?? {
                monitorProducts: ch.monitorProducts,
                monitorCoupons: ch.monitorCoupons,
              }

              return (
                <div key={ch.chatId} className="py-3 flex flex-col gap-2">
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={ch.title}>
                      {ch.title}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono tabular-nums truncate mt-0.5">
                      {ch.username ? `@${ch.username}` : `Chat ID: ${ch.chatId}`}
                    </span>
                  </div>

                  {/* Clean Toggle Buttons side-by-side - strictly NO icons, NO ticks */}
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => toggleProducts(ch.chatId)}
                      className={`h-[42px] px-2 rounded-lg font-bold text-[11px] flex items-center justify-center transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                        current.monitorProducts
                          ? 'bg-blue-50 border border-blue-400 text-blue-700 hover:bg-blue-100'
                          : 'bg-slate-50 border border-slate-300 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {current.monitorProducts ? t.channels.monitorProducts : t.channels.ignoreProducts}
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleCoupons(ch.chatId)}
                      className={`h-[42px] px-2 rounded-lg font-bold text-[11px] flex items-center justify-center transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                        current.monitorCoupons
                          ? 'bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                          : 'bg-slate-50 border border-slate-300 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {current.monitorCoupons ? t.channels.monitorCoupons : t.channels.ignoreCoupons}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop Table (>= md) */}
          <div className="hidden md:block">
            <div className="bg-slate-100 border border-slate-200 rounded-lg px-4 py-2.5 flex items-center text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none mb-2">
              <span className="flex-1">{t.common.channelTelegramGroup}</span>
              <span className="w-56 text-left hidden sm:inline-block">{t.common.chatIdUsername}</span>
              <span className="w-48 text-center">{t.channels.colProducts}</span>
              <span className="w-48 text-center">{t.channels.colCoupons}</span>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredChannels.map((ch: TelegramChannelDTO) => {
                const current = channelOverrides[ch.chatId] ?? {
                  monitorProducts: ch.monitorProducts,
                  monitorCoupons: ch.monitorCoupons,
                }

                return (
                  <div
                    key={ch.chatId}
                    className="py-3.5 px-4 flex items-center hover:bg-slate-50/70 transition-colors rounded-lg gap-2"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <span className="text-sm font-semibold text-slate-900 block truncate" title={ch.title}>
                        {ch.title}
                      </span>
                      <span className="text-xs text-slate-400 font-mono sm:hidden block mt-0.5">
                        {ch.username ? `@${ch.username}` : `ID: ${ch.chatId}`}
                      </span>
                    </div>

                    <div className="w-56 text-left hidden sm:block">
                      <span className="text-xs text-slate-600 font-mono tabular-nums truncate block">
                        {ch.username ? `@${ch.username}` : `Chat ID: ${ch.chatId}`}
                      </span>
                    </div>

                    {/* Clean Products Toggle Button - strictly NO icons, NO ticks */}
                    <div className="w-48 text-center">
                      <button
                        type="button"
                        onClick={() => toggleProducts(ch.chatId)}
                        className={`px-3 py-1.5 rounded-md font-bold text-xs transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
                          current.monitorProducts
                            ? 'bg-blue-50 border border-blue-400 text-blue-700 hover:bg-blue-100'
                            : 'bg-slate-50 border border-slate-300 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {current.monitorProducts ? t.channels.monitorProducts : t.channels.ignoreProducts}
                      </button>
                    </div>

                    {/* Clean Coupons Toggle Button - strictly NO icons, NO ticks */}
                    <div className="w-48 text-center">
                      <button
                        type="button"
                        onClick={() => toggleCoupons(ch.chatId)}
                        className={`px-3 py-1.5 rounded-md font-bold text-xs transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 ${
                          current.monitorCoupons
                            ? 'bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                            : 'bg-slate-50 border border-slate-300 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {current.monitorCoupons ? t.channels.monitorCoupons : t.channels.ignoreCoupons}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {filteredChannels.length > 0 && (
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              {renderSaveButton('w-full sm:w-auto px-4')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

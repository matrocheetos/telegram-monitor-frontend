import { useI18n } from '../../lib/i18n'

export type EmptyStateType = 'interests' | 'channels' | 'products' | 'coupons'

interface EmptyStateProps {
  type: EmptyStateType
  onSyncChannels?: () => void
  isSyncingChannels?: boolean
}

export function EmptyState({ type, onSyncChannels, isSyncingChannels = false }: EmptyStateProps) {
  const { t } = useI18n()

  const titles: Record<EmptyStateType, string> = {
    interests: t.emptyState.interestsTitle,
    channels: t.emptyState.channelsTitle,
    products: t.emptyState.productsTitle,
    coupons: t.emptyState.couponsTitle,
  }

  const messages: Record<EmptyStateType, string> = {
    interests: t.emptyState.interests,
    channels: t.emptyState.channels,
    products: t.emptyState.products,
    coupons: t.emptyState.coupons,
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs w-full" data-testid={`empty-state-${type}`}>
      <h3 className="text-base font-bold text-slate-900 mb-4 select-none">
        {titles[type]}
      </h3>

      <div className="bg-slate-100 border border-slate-200 rounded-lg px-4 py-2.5 mb-3 flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase tracking-wider select-none">
        {type === 'interests' && (
          <>
            <span className="flex-1">{t.dashboard.termHeader}</span>
            <span className="w-72 text-left">{t.dashboard.rulesHeader}</span>
            <span className="w-28 text-center">{t.dashboard.targetPriceHeader}</span>
            <span className="w-16 text-right">{t.common.action}</span>
          </>
        )}

        {type === 'channels' && (
          <>
            <span className="flex-1">{t.common.channelTelegramGroup}</span>
            <span className="w-48 text-left">{t.common.chatIdUsername}</span>
            <span className="w-24 text-center">{t.emptyState.colProductsShort}</span>
            <span className="w-24 text-center">{t.emptyState.colCouponsShort}</span>
          </>
        )}

        {type === 'products' && (
          <>
            <span className="flex-1">{t.offers.colOffer}</span>
            <span className="w-36 text-left">{t.offers.colTerm}</span>
            <span className="w-36 text-left">{t.common.channel}</span>
            <span className="w-24 text-right">{t.offers.colPrice}</span>
            <span className="w-16 text-right">{t.common.action}</span>
          </>
        )}

        {type === 'coupons' && (
          <>
            <span className="w-48 text-left">{t.offers.colCouponCode}</span>
            <span className="w-32 text-left">{t.common.store}</span>
            <span className="flex-1 text-left">{t.offers.colRuleMessage}</span>
            <span className="w-36 text-left">{t.common.channel}</span>
            <span className="w-16 text-right">{t.common.action}</span>
          </>
        )}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg min-h-[220px] flex flex-col items-center justify-center p-6 gap-3">
        <p className="text-sm font-semibold text-slate-500 text-center select-none">
          {messages[type]}
        </p>

        {type === 'channels' && (
          <button
            type="button"
            onClick={onSyncChannels}
            disabled={isSyncingChannels || !onSyncChannels}
            className="mt-1 inline-flex items-center gap-2 bg-blue-50 border border-blue-600 rounded-lg px-4 py-2 text-[13px] font-bold text-blue-700 hover:bg-blue-100 active:bg-blue-200 transition-colors cursor-pointer disabled:opacity-50 select-none"
          >
            {t.channels.syncButton}
          </button>
        )}
      </div>
    </div>
  )
}

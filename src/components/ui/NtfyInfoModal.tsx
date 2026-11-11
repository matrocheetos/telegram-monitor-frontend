import { useEffect } from 'react'
import { useI18n } from '../../lib/i18n'
import { CopyButton } from './CopyButton'

export interface NtfyInfoModalProps {
  isOpen: boolean
  onClose: () => void
  variant: 'product' | 'coupon'
  username?: string
  topic?: string
  publicUrl?: string
  ntfyBaseUrl?: string
  otherTopic?: string
}

export function NtfyInfoModal({
  isOpen,
  onClose,
  variant,
  username = 'mateus',
  topic,
  publicUrl,
  ntfyBaseUrl,
  otherTopic,
}: NtfyInfoModalProps) {
  const { t } = useI18n()

  const isProduct = variant === 'product'

  // Default values based on variant
  const effectiveTopic =
    topic || (isProduct ? `promo-user-${username}` : 'promo-cupom')
  const effectiveOtherTopic =
    otherTopic || (isProduct ? 'promo-cupom' : `promo-user-${username}`)

  const effectiveBaseUrl =
    ntfyBaseUrl ||
    (publicUrl
      ? publicUrl.substring(0, publicUrl.lastIndexOf('/'))
      : 'https://ntfy.example.com')

  const effectivePublicUrl = publicUrl || `${effectiveBaseUrl}/${effectiveTopic}`

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

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ntfy-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/72 backdrop-blur-xs overscroll-contain overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[648px] bg-white border border-slate-300 rounded-xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150 my-auto"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* SVG i Icon Badge */}
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isProduct
                  ? 'bg-[#eff6ff] border border-[#93c5fd] text-[#1d4ed8]'
                  : 'bg-[#f0fdf4] border border-[#86efac] text-[#15803d]'
              }`}
              aria-hidden="true"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="7.5" r="1.2" fill="currentColor" />
                <path d="M12 11v6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>

            <div className="flex flex-col min-w-0">
              <span
                className={`text-[11px] font-bold tracking-wider uppercase truncate ${
                  isProduct ? 'text-blue-700' : 'text-emerald-700'
                }`}
              >
                {isProduct ? t.ntfyModal.badgeUser(username) : t.ntfyModal.badgeCoupons}
              </span>
              <h2
                id="ntfy-modal-title"
                className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug truncate"
              >
                {isProduct ? t.ntfyModal.titleProduct : t.ntfyModal.titleCoupon}
              </h2>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Topic Explanation Box */}
        <div
          className={`p-3.5 sm:p-4 rounded-xl border ${
            isProduct
              ? 'bg-[#eff6ff] border-[#93c5fd]'
              : 'bg-[#f0fdf4] border-[#86efac]'
          }`}
        >
          <h3 className="text-xs sm:text-[13px] font-bold text-slate-900">
            {isProduct
              ? t.ntfyModal.aboutProductTitle(effectiveTopic)
              : t.ntfyModal.aboutCouponTitle(effectiveTopic)}
          </h3>
          <p className="text-xs sm:text-[13px] text-slate-700 mt-1 leading-relaxed">
            {isProduct ? t.ntfyModal.aboutProductDesc : t.ntfyModal.aboutCouponDesc}
          </p>
        </div>

        {/* Step 1: Download App */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 flex flex-col gap-2.5">
          <span className="text-[11px] font-bold text-slate-600 tracking-wider uppercase select-none">
            {t.ntfyModal.step1Title}
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Android Link */}
            <a
              href="https://play.google.com/store/apps/details?id=io.heckel.ntfy"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 p-3 rounded-lg transition-colors flex items-center justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
            >
              <div className="flex flex-col min-w-0 pr-2">
                <span className="text-xs sm:text-[13px] font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  {t.ntfyModal.androidBtn}
                </span>
                <span className="text-[11px] text-slate-500 truncate mt-0.5">
                  {t.ntfyModal.androidUrl}
                </span>
              </div>
              <span className="text-slate-400 group-hover:text-blue-700 text-sm font-bold flex-shrink-0">
                ↗
              </span>
            </a>

            {/* iOS Link */}
            <a
              href="https://apps.apple.com/app/ntfy/id1625396347"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 p-3 rounded-lg transition-colors flex items-center justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
            >
              <div className="flex flex-col min-w-0 pr-2">
                <span className="text-xs sm:text-[13px] font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  {t.ntfyModal.iosBtn}
                </span>
                <span className="text-[11px] text-slate-500 truncate mt-0.5">
                  {t.ntfyModal.iosUrl}
                </span>
              </div>
              <span className="text-slate-400 group-hover:text-blue-700 text-sm font-bold flex-shrink-0">
                ↗
              </span>
            </a>
          </div>
        </div>

        {/* Step 2: Subscribe Instructions */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 flex flex-col gap-2 text-xs sm:text-[13px] text-slate-700">
          <span className="text-[11px] font-bold text-slate-600 tracking-wider uppercase select-none mb-0.5">
            {t.ntfyModal.step2Title}
          </span>

          <p>{t.ntfyModal.step2Item1}</p>
          <p className="font-semibold text-slate-900">
            {isProduct
              ? t.ntfyModal.step2Item2Product(effectiveTopic)
              : t.ntfyModal.step2Item2Coupon(effectiveTopic)}
          </p>
          <p>{t.ntfyModal.step2Item3(effectiveBaseUrl)}</p>

          <div
            className={`p-2.5 rounded-lg border mt-1 font-semibold text-xs leading-relaxed ${
              isProduct
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            {isProduct
              ? t.ntfyModal.step2Item4Product(effectiveOtherTopic)
              : t.ntfyModal.step2Item4Coupon(effectiveOtherTopic)}
          </div>
        </div>

        {/* Quick Topic Copy Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-col min-w-0">
            <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono truncate">
              {t.ntfyModal.topicLabel(effectiveTopic)}
            </span>
            <span
              className="text-[11px] sm:text-xs text-slate-500 font-mono truncate mt-0.5"
              title={effectivePublicUrl}
            >
              {effectivePublicUrl}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 flex-shrink-0">
            <CopyButton
              text={effectiveTopic}
              label={t.common.copyTopic}
              copiedLabel={t.common.topicCopied}
              variant={isProduct ? 'blue-outline' : 'green-outline'}
              className="h-10 text-xs px-3 justify-center w-full sm:w-auto"
            />
            <CopyButton
              text={effectivePublicUrl}
              label={t.common.copyUrl}
              variant={isProduct ? 'blue' : 'green'}
              className="h-10 text-xs px-3 justify-center w-full sm:w-auto"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
          <span className="text-xs text-slate-500 select-none">
            {isProduct
              ? t.ntfyModal.alsoAvailableCoupon(effectiveOtherTopic)
              : t.ntfyModal.alsoAvailableProduct(effectiveOtherTopic)}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="h-11 px-6 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-lg text-sm font-bold transition-colors cursor-pointer w-full sm:w-auto flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1"
          >
            {t.ntfyModal.doneBtn}
          </button>
        </div>
      </div>
    </div>
  )
}

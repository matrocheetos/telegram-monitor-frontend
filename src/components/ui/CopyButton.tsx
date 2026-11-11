import { useState } from 'react'
import { useI18n } from '../../lib/i18n'

export type CopyButtonVariant = 'blue' | 'green' | 'blue-outline' | 'green-outline'

interface CopyButtonProps {
  text: string
  label?: string
  copiedLabel?: string
  variant?: CopyButtonVariant
  className?: string
}

export function CopyButton({
  text,
  label,
  copiedLabel,
  variant = 'blue',
  className = '',
}: CopyButtonProps) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  const defaultLabel = variant.startsWith('green') ? t.common.copyCoupon : t.common.copyUrl
  const finalLabel = label ?? defaultLabel
  const defaultCopied = finalLabel === t.common.copyTopic ? t.common.topicCopied : t.common.copied
  const finalCopied = copiedLabel ?? defaultCopied

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback if clipboard access denied
    }
  }

  const baseStyles =
    'inline-flex items-center justify-center font-semibold text-[13px] rounded-lg transition-colors cursor-pointer select-none px-3.5 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1'

  const variantStyles: Record<CopyButtonVariant, string> = {
    blue: copied
      ? 'bg-blue-700 text-white shadow-xs focus-visible:ring-blue-500'
      : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs focus-visible:ring-blue-500',
    'blue-outline': copied
      ? 'bg-blue-100 border border-blue-400 text-blue-800 focus-visible:ring-blue-500'
      : 'bg-[#eff6ff] hover:bg-blue-100 active:bg-blue-200 border border-[#93c5fd] text-[#1d4ed8] focus-visible:ring-blue-500',
    green: copied
      ? 'bg-[#15803d] text-white shadow-xs focus-visible:ring-emerald-500'
      : 'bg-[#16a34a] hover:bg-[#15803d] active:bg-[#166534] text-white shadow-xs focus-visible:ring-emerald-500',
    'green-outline': copied
      ? 'bg-emerald-100 border border-emerald-400 text-emerald-800 focus-visible:ring-emerald-500'
      : 'bg-[#f0fdf4] hover:bg-emerald-100 active:bg-emerald-200 border border-[#86efac] text-[#15803d] focus-visible:ring-emerald-500',
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      aria-label={copied ? finalCopied : finalLabel}
    >
      {copied ? finalCopied : finalLabel}
    </button>
  )
}

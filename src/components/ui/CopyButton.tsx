import { useState } from 'react'
import { useI18n } from '../../lib/i18n'

interface CopyButtonProps {
  text: string
  label?: string
  copiedLabel?: string
  variant?: 'blue' | 'green'
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

  const defaultLabel = variant === 'green' ? t.common.copyCoupon : t.common.copyUrl
  const finalLabel = label ?? defaultLabel
  const finalCopied = copiedLabel ?? t.common.copied

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

  const baseStyles = 'inline-flex items-center justify-center font-semibold text-[13px] rounded-lg transition-colors cursor-pointer select-none px-3.5 py-2'

  const variantStyles = {
    blue: copied
      ? 'bg-blue-100 border border-blue-400 text-blue-800'
      : 'bg-blue-50 border border-blue-300 text-blue-700 hover:bg-blue-100 active:bg-blue-200',
    green: copied
      ? 'bg-emerald-600 text-white border border-emerald-700 shadow-xs'
      : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold border border-emerald-700 shadow-xs',
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

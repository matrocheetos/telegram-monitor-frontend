import { useState } from 'react'
import type { FormEvent } from 'react'
import { useI18n } from '../../lib/i18n'

interface ResetPasswordModalProps {
  isOpen: boolean
  username: string
  onClose: () => void
  onSubmit: (password: string) => void
  isPending?: boolean
}

export function ResetPasswordModal({
  isOpen,
  username,
  onClose,
  onSubmit,
  isPending = false,
}: ResetPasswordModalProps) {
  const { t } = useI18n()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      setError(t.setup.passwordMinLength)
      return
    }
    setError(null)
    onSubmit(password)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-password-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
        <h2 id="reset-password-title" className="text-lg font-bold text-slate-900 select-none">
          {t.users.resetPassword}: @{username}
        </h2>

        {error && (
          <div role="alert" className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-user-password" className="text-xs font-semibold text-slate-700">
              {t.setup.password}
            </label>
            <input
              id="new-user-password"
              name="newPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              minLength={8}
              autoFocus
              autoComplete="new-password"
              className="h-10 px-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-colors"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
            >
              {isPending ? '...' : t.common.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

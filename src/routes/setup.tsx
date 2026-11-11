import { useState } from 'react'
import type { FormEvent } from 'react'
import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { authQueries, useSetupMutation } from '../lib/api/queries'
import { AuthTopBar } from '../components/layout/AuthTopBar'
import { useI18n } from '../lib/i18n'
import { ApiError } from '../lib/api/client'

export const Route = createFileRoute('/setup')({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(authQueries.session())

    if (!session.needsInitialSetup) {
      if (session.authenticated) {
        if (session.user?.role === 'admin' && !session.telegram?.connected) {
          throw redirect({ to: '/admin/telegram' })
        }
        throw redirect({ to: '/dashboard' })
      }
      throw redirect({ to: '/login' })
    }
  },
  component: SetupPage,
})

function SetupPage() {
  const { t } = useI18n()
  const router = useRouter()
  const setupMutation = useSetupMutation()

  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [clientError, setClientError] = useState<string | null>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setClientError(null)

    const trimmedUser = username.trim()
    if (!trimmedUser) {
      setClientError(t.setup.usernameRequired)
      return
    }

    if (password.length < 8) {
      setClientError(t.setup.passwordMinLength)
      return
    }

    if (password !== confirmPassword) {
      setClientError(t.setup.passwordMismatch)
      return
    }

    setupMutation.mutate(
      { username: trimmedUser, password, passwordConfirm: confirmPassword },
      {
        onSuccess: () => {
          router.navigate({ to: '/admin/telegram' })
        },
      },
    )
  }

  const errorMessage = clientError || (setupMutation.error instanceof ApiError ? setupMutation.error.message : null)

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between items-center">
      <AuthTopBar isInitialSetup={true} />

      <main className="w-full flex items-center justify-center p-4 sm:p-6 flex-1">
        <div className="w-full max-w-[460px] bg-white border border-slate-200 rounded-xl p-6 sm:p-10 shadow-xl">
          <h1 className="text-[22px] sm:text-[26px] font-bold text-slate-900 tracking-tight mb-5 sm:mb-6 select-none">
            {t.setup.title}
          </h1>

          {errorMessage && (
            <div
              role="alert"
              className="mb-5 sm:mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm font-semibold text-red-600"
            >
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="setup-username" className="text-sm font-semibold text-slate-800">
                {t.setup.username}
              </label>
              <input
                id="setup-username"
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t.setup.usernamePlaceholder}
                required
                autoComplete="username"
                spellCheck={false}
                className="h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-lg text-base sm:text-[15px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="setup-password" className="text-sm font-semibold text-slate-800">
                {t.setup.password}
              </label>
              <input
                id="setup-password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                minLength={8}
                autoComplete="new-password"
                className="h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-lg text-base sm:text-[15px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="setup-confirm-password" className="text-sm font-semibold text-slate-800">
                {t.setup.confirmPassword}
              </label>
              <input
                id="setup-confirm-password"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoComplete="new-password"
                className="h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-lg text-base sm:text-[15px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={setupMutation.isPending}
              className="mt-2 h-12 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-[15px] rounded-lg transition-colors cursor-pointer w-full disabled:opacity-50 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              {setupMutation.isPending ? '…' : t.setup.submit}
            </button>
          </form>
        </div>
      </main>

      <div className="h-14 w-full" aria-hidden="true" />
    </div>
  )
}

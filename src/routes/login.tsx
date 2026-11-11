import { useState } from 'react'
import type { FormEvent } from 'react'
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { authQueries, useLoginMutation } from '../lib/api/queries'
import { AuthTopBar } from '../components/layout/AuthTopBar'
import { useI18n } from '../lib/i18n'
import { ApiError } from '../lib/api/client'

export const Route = createFileRoute('/login')({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(authQueries.session())

    if (session.needsInitialSetup) {
      throw redirect({ to: '/setup' })
    }

    if (session.authenticated) {
      if (session.user?.role === 'admin' && !session.telegram?.connected) {
        throw redirect({ to: '/admin/telegram' })
      }
      throw redirect({ to: '/dashboard' })
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const loginMutation = useLoginMutation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    loginMutation.mutate(
      { username: username.trim(), password },
      {
        onSuccess: (session) => {
          if (session.user?.role === 'admin' && !session.telegram?.connected) {
            navigate({ to: '/admin/telegram' })
          } else {
            navigate({ to: '/dashboard' })
          }
        },
      },
    )
  }

  let errorMessage: string | null = null
  if (loginMutation.error) {
    if (loginMutation.error instanceof ApiError && (loginMutation.error.status === 401 || loginMutation.error.status === 403)) {
      errorMessage = t.login.invalidCredentials
    } else if (loginMutation.error instanceof ApiError) {
      errorMessage = loginMutation.error.message
    } else {
      errorMessage = t.apiErrors.genericError
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between items-center">
      <AuthTopBar />

      <main className="w-full flex items-center justify-center p-4 sm:p-6 flex-1">
        <div className="w-full max-w-[460px] bg-white border border-slate-200 rounded-xl p-6 sm:p-10 shadow-xl">
          <h1 className="text-[22px] sm:text-[28px] font-bold text-slate-900 tracking-tight mb-5 sm:mb-6 select-none">
            {t.login.title}
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
              <label htmlFor="login-username" className="text-sm font-semibold text-slate-800">
                {t.login.username}
              </label>
              <input
                id="login-username"
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                autoComplete="username"
                spellCheck={false}
                className="h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-lg text-base sm:text-[15px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-password" className="text-sm font-semibold text-slate-800">
                {t.login.password}
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                autoComplete="current-password"
                className="h-11 px-3.5 bg-slate-50 border border-slate-300 rounded-lg text-base sm:text-[15px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="mt-2 h-12 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-[16px] rounded-lg transition-colors cursor-pointer w-full disabled:opacity-50 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              {loginMutation.isPending ? '…' : t.login.submit}
            </button>
          </form>
        </div>
      </main>

      <div className="h-14 w-full" aria-hidden="true" />
    </div>
  )
}

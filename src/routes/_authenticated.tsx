import { useState, useEffect } from 'react'
import { createFileRoute, Outlet, redirect, Link, useRouter } from '@tanstack/react-router'
import { authQueries, useLogoutMutation } from '../lib/api/queries'
import { AppSidebar } from '../components/layout/AppSidebar'
import { LanguageSwitcher } from '../components/layout/LanguageSwitcher'
import { useI18n } from '../lib/i18n'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(authQueries.session())

    if (session.needsInitialSetup) {
      throw redirect({ to: '/setup' })
    }

    if (!session.authenticated) {
      throw redirect({ to: '/login' })
    }

    return { session }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { session } = Route.useRouteContext()
  const { t } = useI18n()
  const router = useRouter()
  const logoutMutation = useLogoutMutation()

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const role = session.user?.role ?? 'user'
  const username = session.user?.username ?? ''
  const controlCenterLabel =
    role === 'admin' ? t.common.adminControlCenter : t.common.userControlCenter

  const handleQuickLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setIsDrawerOpen(false)
        router.navigate({ to: '/login' })
      },
    })
  }

  // Close drawer on Escape
  useEffect(() => {
    if (!isDrawerOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDrawerOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isDrawerOpen])

  const userMobilePills = [
    { to: '/dashboard' as const, label: t.navShort.myTerms },
    { to: '/offers' as const, label: t.navShort.offersFound },
  ]

  const adminMobilePills = [
    { to: '/admin/telegram' as const, label: t.navShort.telegram },
    { to: '/admin/channels' as const, label: t.navShort.channels },
    { to: '/admin/users' as const, label: t.navShort.users },
    { to: '/dashboard' as const, label: t.navShort.terms },
    { to: '/offers' as const, label: t.navShort.offers },
  ]

  const mobilePills = role === 'admin' ? adminMobilePills : userMobilePills

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      {/* Desktop Sidebar (>= 1024px) */}
      <div className="hidden lg:flex lg:sticky lg:top-0 lg:h-dvh lg:flex-shrink-0">
        <AppSidebar username={username} role={role} />
      </div>

      {/* Mobile App Header (< 1024px, 56px height) */}
      <header className="lg:hidden h-14 bg-slate-900 border-b border-slate-700/80 px-4 flex items-center justify-between sticky top-0 z-30 flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="w-10 h-10 rounded-lg bg-[#1e293b] hover:bg-slate-800 border border-[#334155] text-white flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900"
            aria-label={t.aria.mobileMenuButton}
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <img
            src="/logo-icon.png"
            alt=""
            width={28}
            height={28}
            className="w-7 h-7 object-contain flex-shrink-0 select-none"
          />

          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-bold text-white tracking-wider uppercase select-none truncate leading-tight">
              {t.common.appName}
            </span>
            <span className="text-[10px] text-slate-400 select-none truncate leading-tight mt-0.5">
              {controlCenterLabel}
            </span>
          </div>
        </div>

        <div className="bg-[#1e293b] border border-[#334155] rounded-lg px-2.5 py-1.5 flex items-center shadow-xs flex-shrink-0">
          <LanguageSwitcher variant="dark" />
        </div>
      </header>

      {/* Mobile Navigation Bar (< 1024px, 44px height) */}
      <nav
        aria-label="Mobile quick navigation"
        className="lg:hidden h-11 bg-[#1e293b] border-b border-slate-700/80 px-3 flex items-center gap-2 sticky top-14 z-20 flex-shrink-0"
      >
        <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto overscroll-x-contain no-scrollbar py-1">
          {mobilePills.map((pill) => (
            <Link
              key={pill.to}
              to={pill.to}
              className="text-[11px] font-medium py-1.5 px-2.5 rounded-md text-slate-300 hover:text-white bg-slate-900/60 transition-colors whitespace-nowrap flex-shrink-0 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              activeProps={{
                className:
                  'text-[11px] font-bold py-1.5 px-2.5 rounded-md text-white bg-blue-600 transition-colors whitespace-nowrap flex-shrink-0 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
              }}
            >
              {pill.label}
            </Link>
          ))}
        </div>

        <div aria-hidden="true" className="h-[22px] w-px bg-slate-600/70 flex-shrink-0" />

        <button
          type="button"
          onClick={handleQuickLogout}
          disabled={logoutMutation.isPending}
          aria-label={t.common.logout}
          title={t.common.logout}
          className="w-9 h-8 bg-[#334155] hover:bg-red-700 active:bg-red-800 text-slate-50 rounded-md flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer touch-manipulation disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </nav>

      {/* Mobile Drawer (Slide-Over Sidebar) */}
      {isDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
          className="fixed inset-0 z-50 lg:hidden"
        >
          {/* Backdrop */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Drawer content */}
          <div className="fixed top-0 bottom-0 left-0 w-80 max-w-[90vw] bg-slate-900 z-50 shadow-2xl overflow-y-auto overscroll-contain">
            <AppSidebar
              username={username}
              role={role}
              onClose={() => setIsDrawerOpen(false)}
              onNavigate={() => setIsDrawerOpen(false)}
              className="min-h-full border-r-0"
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  )
}

import { Link, useRouter } from '@tanstack/react-router'
import { useI18n } from '../../lib/i18n'
import { useLogoutMutation } from '../../lib/api/queries'

interface AppSidebarProps {
  username: string
  role: 'admin' | 'user'
  onNavigate?: () => void
  onClose?: () => void
  className?: string
}

export function AppSidebar({ username, role, onNavigate, onClose, className = '' }: AppSidebarProps) {
  const { t } = useI18n()
  const router = useRouter()
  const logoutMutation = useLogoutMutation()

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        onNavigate?.()
        router.navigate({ to: '/login' })
      },
    })
  }

  const adminNavItems = [
    { to: '/admin/telegram' as const, label: t.nav.telegramConnection },
    { to: '/admin/channels' as const, label: t.nav.monitoredChannels },
    { to: '/admin/users' as const, label: t.nav.userManagement },
    { to: '/dashboard' as const, label: t.nav.myInterests },
    { to: '/offers' as const, label: t.nav.offersFound },
  ]

  const userNavItems = [
    { to: '/dashboard' as const, label: t.nav.myInterests },
    { to: '/offers' as const, label: t.nav.offersFound },
  ]

  const navItems = role === 'admin' ? adminNavItems : userNavItems
  const controlCenterLabel = role === 'admin' ? t.common.adminControlCenter : t.common.userControlCenter

  return (
    <aside
      className={`${onClose ? 'w-full' : 'w-76'} shrink-0 lg:sticky lg:top-0 lg:h-dvh lg:max-h-dvh lg:overflow-hidden bg-slate-900 border-r border-slate-700 flex flex-col justify-between p-4 ${className}`}
    >
      <div className="flex flex-col gap-6 flex-1 min-h-0">
        <div className="flex items-center justify-between gap-2 px-1 pt-1 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/logo-icon.png"
              alt=""
              width={32}
              height={32}
              className="w-8 h-8 object-contain shrink-0 select-none"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-[15px] font-bold text-white tracking-wide uppercase select-none whitespace-nowrap">
                {t.common.appName}
              </span>
              <span className="text-xs text-slate-400 select-none truncate">
                {controlCenterLabel}
              </span>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Fechar menu"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        <nav className="flex flex-col gap-1.5 flex-1 overflow-y-auto min-h-0" aria-label="Sidebar navigation">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => onNavigate?.()}
              className="px-3 py-2.5 rounded-lg text-sm text-slate-300 font-normal hover:bg-slate-800 hover:text-white transition-colors flex items-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900"
              activeProps={{
                className: 'px-3 py-2.5 rounded-lg text-sm bg-blue-600 text-white font-semibold transition-colors flex items-center flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-1 focus-visible:ring-offset-slate-900',
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="bg-[#1e293b] border border-slate-700 rounded-lg p-3 flex flex-col gap-2.5 mt-auto shrink-0">
        <div className="flex flex-col">
          <span className="text-[13px] font-semibold text-white truncate" title={username}>
            {t.common.connectedAs}{username}
          </span>
          <span
            className={`text-xs ${
              role === 'admin' ? 'text-blue-300 font-medium' : 'text-slate-400 font-normal'
            }`}
          >
            {role === 'admin' ? t.common.roleAdmin : t.common.roleUser}
          </span>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="h-11 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-slate-100 rounded-md px-3 text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer w-full disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        >
          {t.common.logout}
        </button>
      </div>
    </aside>
  )
}

import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { authQueries } from '../lib/api/queries'
import { AppSidebar } from '../components/layout/AppSidebar'

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

  return (
    <div className="min-h-screen flex bg-slate-50">
      <AppSidebar
        username={session.user?.username ?? ''}
        role={session.user?.role ?? 'user'}
      />
      <main className="flex-1 min-w-0 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

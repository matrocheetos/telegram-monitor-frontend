import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { authQueries } from '../../lib/api/queries'

export const Route = createFileRoute('/_authenticated/_admin')({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(authQueries.session())

    if (session.user?.role !== 'admin') {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: AdminLayout,
})

function AdminLayout() {
  return <Outlet />
}

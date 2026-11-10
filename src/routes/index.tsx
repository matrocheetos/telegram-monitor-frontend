import { createFileRoute, redirect } from '@tanstack/react-router'
import { authQueries } from '../lib/api/queries'

export const Route = createFileRoute('/')({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(authQueries.session())

    if (session.needsInitialSetup) {
      throw redirect({ to: '/setup' })
    }

    if (!session.authenticated) {
      throw redirect({ to: '/login' })
    }

    if (session.user?.role === 'admin' && !session.telegram?.connected) {
      throw redirect({ to: '/admin/telegram' })
    }

    throw redirect({ to: '/dashboard' })
  },
  component: () => null,
})

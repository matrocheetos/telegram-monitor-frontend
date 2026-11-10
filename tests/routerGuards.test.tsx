import { describe, it, expect, beforeEach } from 'vitest'
import { createMemoryHistory, createRouter } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { routeTree } from '../src/app/routeTree.gen'
import type { SessionResponse } from '../src/lib/api/types'

describe('Router Guards (beforeLoad)', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity,
        },
      },
    })
  })

  function setupSession(session: SessionResponse) {
    queryClient.setQueryData(['auth', 'session'], session)
  }

  function createTestRouter(initialPath: string) {
    const history = createMemoryHistory({ initialEntries: [initialPath] })
    const router = createRouter({
      routeTree,
      history,
      context: { queryClient },
    })
    return router
  }

  describe('Scenario 1: First Boot (needsInitialSetup: true)', () => {
    const firstBootSession: SessionResponse = {
      needsInitialSetup: true,
      authenticated: false,
      csrfToken: 'csrf-1',
      user: null,
      telegram: null,
    }

    it('redirects / to /setup', async () => {
      setupSession(firstBootSession)
      const router = createTestRouter('/')
      await router.load()
      expect(router.state.location.pathname).toBe('/setup')
    })

    it('redirects /login to /setup', async () => {
      setupSession(firstBootSession)
      const router = createTestRouter('/login')
      await router.load()
      expect(router.state.location.pathname).toBe('/setup')
    })

    it('redirects /dashboard to /setup', async () => {
      setupSession(firstBootSession)
      const router = createTestRouter('/dashboard')
      await router.load()
      expect(router.state.location.pathname).toBe('/setup')
    })

    it('redirects /admin/telegram to /setup', async () => {
      setupSession(firstBootSession)
      const router = createTestRouter('/admin/telegram')
      await router.load()
      expect(router.state.location.pathname).toBe('/setup')
    })

    it('allows /setup to load', async () => {
      setupSession(firstBootSession)
      const router = createTestRouter('/setup')
      await router.load()
      expect(router.state.location.pathname).toBe('/setup')
    })
  })

  describe('Scenario 2: Anonymous User (needsInitialSetup: false, authenticated: false)', () => {
    const anonymousSession: SessionResponse = {
      needsInitialSetup: false,
      authenticated: false,
      csrfToken: 'csrf-2',
      user: null,
      telegram: null,
    }

    it('redirects / to /login', async () => {
      setupSession(anonymousSession)
      const router = createTestRouter('/')
      await router.load()
      expect(router.state.location.pathname).toBe('/login')
    })

    it('redirects /setup to /login', async () => {
      setupSession(anonymousSession)
      const router = createTestRouter('/setup')
      await router.load()
      expect(router.state.location.pathname).toBe('/login')
    })

    it('redirects /dashboard to /login', async () => {
      setupSession(anonymousSession)
      const router = createTestRouter('/dashboard')
      await router.load()
      expect(router.state.location.pathname).toBe('/login')
    })

    it('redirects /admin/users to /login', async () => {
      setupSession(anonymousSession)
      const router = createTestRouter('/admin/users')
      await router.load()
      expect(router.state.location.pathname).toBe('/login')
    })

    it('allows /login to load', async () => {
      setupSession(anonymousSession)
      const router = createTestRouter('/login')
      await router.load()
      expect(router.state.location.pathname).toBe('/login')
    })
  })

  describe('Scenario 3: Standard User (role: user)', () => {
    const userSession: SessionResponse = {
      needsInitialSetup: false,
      authenticated: true,
      csrfToken: 'csrf-3',
      user: { id: 2, username: 'mateus', role: 'user', ntfyTopic: 'promo/user/mateus' },
      telegram: null,
    }

    it('redirects / to /dashboard', async () => {
      setupSession(userSession)
      const router = createTestRouter('/')
      await router.load()
      expect(router.state.location.pathname).toBe('/dashboard')
    })

    it('redirects /setup to /dashboard', async () => {
      setupSession(userSession)
      const router = createTestRouter('/setup')
      await router.load()
      expect(router.state.location.pathname).toBe('/dashboard')
    })

    it('redirects /login to /dashboard', async () => {
      setupSession(userSession)
      const router = createTestRouter('/login')
      await router.load()
      expect(router.state.location.pathname).toBe('/dashboard')
    })

    it('allows /dashboard and /offers to load', async () => {
      setupSession(userSession)
      const router1 = createTestRouter('/dashboard')
      await router1.load()
      expect(router1.state.location.pathname).toBe('/dashboard')

      const router2 = createTestRouter('/offers')
      await router2.load()
      expect(router2.state.location.pathname).toBe('/offers')
    })

    it('blocks access to /admin/telegram and redirects to /dashboard', async () => {
      setupSession(userSession)
      const router = createTestRouter('/admin/telegram')
      await router.load()
      expect(router.state.location.pathname).toBe('/dashboard')
    })

    it('blocks access to /admin/channels and redirects to /dashboard', async () => {
      setupSession(userSession)
      const router = createTestRouter('/admin/channels')
      await router.load()
      expect(router.state.location.pathname).toBe('/dashboard')
    })

    it('blocks access to /admin/users and redirects to /dashboard', async () => {
      setupSession(userSession)
      const router = createTestRouter('/admin/users')
      await router.load()
      expect(router.state.location.pathname).toBe('/dashboard')
    })
  })

  describe('Scenario 4: Admin with Telegram Disconnected', () => {
    const adminDisconnectedSession: SessionResponse = {
      needsInitialSetup: false,
      authenticated: true,
      csrfToken: 'csrf-4',
      user: { id: 1, username: 'admin', role: 'admin', ntfyTopic: 'promo/user/admin' },
      telegram: { connected: false, phoneMasked: '' },
    }

    it('redirects / to /admin/telegram', async () => {
      setupSession(adminDisconnectedSession)
      const router = createTestRouter('/')
      await router.load()
      expect(router.state.location.pathname).toBe('/admin/telegram')
    })

    it('allows /dashboard to load for admin', async () => {
      setupSession(adminDisconnectedSession)
      const router = createTestRouter('/dashboard')
      await router.load()
      expect(router.state.location.pathname).toBe('/dashboard')
    })

    it('allows /admin/telegram to load', async () => {
      setupSession(adminDisconnectedSession)
      const router = createTestRouter('/admin/telegram')
      await router.load()
      expect(router.state.location.pathname).toBe('/admin/telegram')
    })
  })

  describe('Scenario 5: Admin with Telegram Connected', () => {
    const adminConnectedSession: SessionResponse = {
      needsInitialSetup: false,
      authenticated: true,
      csrfToken: 'csrf-5',
      user: { id: 1, username: 'admin', role: 'admin', ntfyTopic: 'promo/user/admin' },
      telegram: { connected: true, phoneMasked: '+55 11 *****-**99' },
    }

    it('redirects / to /dashboard', async () => {
      setupSession(adminConnectedSession)
      const router = createTestRouter('/')
      await router.load()
      expect(router.state.location.pathname).toBe('/dashboard')
    })

    it('allows access to all admin routes', async () => {
      setupSession(adminConnectedSession)

      const telegramRouter = createTestRouter('/admin/telegram')
      await telegramRouter.load()
      expect(telegramRouter.state.location.pathname).toBe('/admin/telegram')

      const channelsRouter = createTestRouter('/admin/channels')
      await channelsRouter.load()
      expect(channelsRouter.state.location.pathname).toBe('/admin/channels')

      const usersRouter = createTestRouter('/admin/users')
      await usersRouter.load()
      expect(usersRouter.state.location.pathname).toBe('/admin/users')

      const dashboardRouter = createTestRouter('/dashboard')
      await dashboardRouter.load()
      expect(dashboardRouter.state.location.pathname).toBe('/dashboard')
    })
  })
})

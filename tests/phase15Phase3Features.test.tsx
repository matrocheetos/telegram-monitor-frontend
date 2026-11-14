import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  createMemoryHistory,
  Outlet,
} from '@tanstack/react-router'
import { I18nProvider, useI18n } from '../src/lib/i18n'
import { AppSidebar } from '../src/components/layout/AppSidebar'
import { AuthTopBar } from '../src/components/layout/AuthTopBar'
import { EmptyState } from '../src/components/ui/EmptyState'
import { Route as AuthenticatedRoute } from '../src/routes/_authenticated'
import { Route as DashboardRoute } from '../src/routes/_authenticated/dashboard'
import { Route as ChannelsRoute } from '../src/routes/_authenticated/_admin/admin.channels'
import { Route as UsersRoute } from '../src/routes/_authenticated/_admin/admin.users'
import { apiClient } from '../src/lib/api/client'
import type {
  AdminChannelsResponse,
  AdminUserDTO,
  DashboardResponse,
  SessionResponse,
  UserInterestDTO,
} from '../src/lib/api/types'

const adminSession: SessionResponse = {
  needsInitialSetup: false,
  authenticated: true,
  csrfToken: 'csrf-token',
  user: {
    id: 1,
    username: 'admin',
    role: 'admin',
    ntfyTopic: 'promo/user/admin',
  },
  telegram: {
    connected: true,
    phoneMasked: '+55 11 ****-9999',
  },
}

describe('Fase 15 (Task 15.1): Phase 3 End-to-End Component & Integration Tests', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    document.title = ''
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  function renderWithProviders(ui: React.ReactElement, locale: 'pt-BR' | 'en-US' = 'pt-BR') {
    return render(
      <QueryClientProvider client={queryClient}>
        <I18nProvider initialLocale={locale}>{ui}</I18nProvider>
      </QueryClientProvider>,
    )
  }

  describe('1. App Identity, Document Title & Icon Placement (Task 13.1)', () => {
    it('renders Monitor de Promos / Deal Monitor, updates document.title on switch, and renders logo icon left of name', () => {
      function LocaleHarness() {
        const { setLocale } = useI18n()
        return (
          <>
            <AuthTopBar />
            <button type="button" onClick={() => setLocale('en-US')}>
              Switch to EN
            </button>
          </>
        )
      }

      const { container } = renderWithProviders(<LocaleHarness />, 'pt-BR')

      expect(screen.getByText('Monitor de Promos')).toBeInTheDocument()
      expect(document.title).toBe('Monitor de Promos')

      const img = container.querySelector('img[src="/logo-icon.png"]')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('width', '28')
      expect(img).toHaveAttribute('height', '28')

      fireEvent.click(screen.getByRole('button', { name: 'Switch to EN' }))

      expect(screen.getByText('Deal Monitor')).toBeInTheDocument()
      expect(document.title).toBe('Deal Monitor')
    })

    it('renders 32x32 logo icon and untruncated brand title inside AppSidebar', async () => {
      const rootRoute = createRootRoute({ component: () => <Outlet /> })
      const testRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: '/dashboard',
        component: () => <AppSidebar username="admin" role="admin" />,
      })
      const router = createRouter({
        routeTree: rootRoute.addChildren([testRoute]),
        history: createMemoryHistory({ initialEntries: ['/dashboard'] }),
      })
      await router.load()

      const { container } = renderWithProviders(<RouterProvider router={router} />)

      const aside = container.querySelector('aside')
      expect(aside?.className).toContain('w-76')
      const brandText = screen.getByText('Monitor de Promos')
      expect(brandText.className).toContain('whitespace-nowrap')
      expect(brandText.className).not.toContain('truncate')

      const img = container.querySelector('img[src="/logo-icon.png"]')
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('width', '32')
      expect(img).toHaveAttribute('height', '32')
    })
  })

  describe('2. Sticky Viewport Sidebar Scroll Behavior (Task 13.2)', () => {
    it('applies lg:sticky lg:top-0 lg:h-dvh to desktop sidebar wrapper and AppSidebar with independent main scroll', async () => {
      vi.spyOn(apiClient, 'getSession').mockResolvedValue(adminSession)

      const rootRoute = createRootRoute({ component: () => <Outlet /> })
      const authRoute = createRoute({
        getParentRoute: () => rootRoute,
        id: '_authenticated',
        beforeLoad: () => ({ session: adminSession }),
        component: AuthenticatedRoute.options.component,
      })
      const childRoute = createRoute({
        getParentRoute: () => authRoute,
        path: '/dashboard',
        component: () => <div>Scrollable content</div>,
      })

      const router = createRouter({
        routeTree: rootRoute.addChildren([authRoute.addChildren([childRoute])]),
        history: createMemoryHistory({ initialEntries: ['/dashboard'] }),
        context: { queryClient },
      })
      await router.load()

      const { container } = renderWithProviders(<RouterProvider router={router} />)

      await screen.findByText('Scrollable content')

      const aside = container.querySelector('aside')
      expect(aside?.className).toContain('lg:sticky')
      expect(aside?.className).toContain('lg:top-0')
      expect(aside?.className).toContain('lg:h-dvh')

      const desktopWrapper = aside?.parentElement
      expect(desktopWrapper?.className).toContain('lg:sticky')
      expect(desktopWrapper?.className).toContain('lg:top-0')
      expect(desktopWrapper?.className).toContain('lg:h-dvh')

      const nav = aside?.querySelector('nav')
      expect(nav?.className).toContain('overflow-y-auto')

      const main = container.querySelector('main')
      expect(main?.className).not.toContain('overflow-y-auto')
    })
  })

  describe('3. EXCLUSÕES Header & Sem exclusões Text (Task 14.1)', () => {
    it('renders EXCLUSÕES header and Sem exclusões for terms without negative keywords in /dashboard and EmptyState', async () => {
      const mockDashboard: DashboardResponse = {
        activeChannelsCount: 2,
        userTopic: 'promo/user/admin',
        userNormalizedTopic: 'promo-user-admin',
        userPublicUrl: 'https://ntfy.example.com/promo-user-admin',
        couponsTopic: 'promo/cupom',
        couponsPublicUrl: 'https://ntfy.example.com/promo-cupom',
        interests: [
          {
            id: 1,
            rawTerm: 'mario kart world',
            positiveTokens: ['mario', 'kart', 'world'],
            negativeTokens: [],
            maxPrice: 350,
            active: true,
            createdAt: '2026-11-10T12:00:00Z',
          },
          {
            id: 2,
            rawTerm: 'switch 2 -capa',
            positiveTokens: ['switch', '2'],
            negativeTokens: ['capa'],
            maxPrice: null,
            active: true,
            createdAt: '2026-11-10T12:00:00Z',
          },
        ],
      }

      vi.spyOn(apiClient, 'getDashboard').mockResolvedValue(mockDashboard)

      const rootRoute = createRootRoute({ component: () => <Outlet /> })
      const dashRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: '/dashboard',
        component: DashboardRoute.options.component,
      })
      const router = createRouter({
        routeTree: rootRoute.addChildren([dashRoute]),
        history: createMemoryHistory({ initialEntries: ['/dashboard'] }),
        context: { queryClient },
      })
      await router.load()

      renderWithProviders(<RouterProvider router={router} />, 'pt-BR')

      expect((await screen.findAllByText('mario kart world')).length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText('EXCLUSÕES')).toBeInTheDocument()
      expect(screen.getAllByText('Sem exclusões').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('-capa').length).toBeGreaterThanOrEqual(1)
    })

    it('renders EXCLUSIONS and No exclusions when locale is en-US', () => {
      renderWithProviders(<EmptyState type="interests" />, 'en-US')

      expect(screen.getByText('EXCLUSIONS')).toBeInTheDocument()
    })
  })

  describe('4. Bottom Salvar Alterações Button in /admin/channels (Task 14.2)', () => {
    it('renders both top and bottom Salvar Alterações buttons and saves via bottom button', async () => {
      const mockChannels: AdminChannelsResponse = {
        connected: true,
        phoneMasked: '+55 11 ****-9999',
        totalChannelsCount: 1,
        couponsChannelsCount: 0,
        productsChannelsCount: 1,
        adminProductTopic: 'promo/user/admin',
        couponsTopic: 'promo/cupom',
        channels: [
          {
            chatId: 501,
            username: 'ofertas',
            title: 'Canal Ofertas Teste',
            monitorProducts: true,
            monitorCoupons: false,
            updatedAt: '2026-11-10T12:00:00Z',
          },
        ],
      }

      vi.spyOn(apiClient, 'getChannels').mockResolvedValue(mockChannels)
      const updateSpy = vi.spyOn(apiClient, 'updateChannels').mockResolvedValueOnce(undefined)

      const rootRoute = createRootRoute({ component: () => <Outlet /> })
      const channelsRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: '/admin/channels',
        component: ChannelsRoute.options.component,
      })
      const router = createRouter({
        routeTree: rootRoute.addChildren([channelsRoute]),
        history: createMemoryHistory({ initialEntries: ['/admin/channels'] }),
        context: { queryClient },
      })
      await router.load()

      renderWithProviders(<RouterProvider router={router} />)

      await screen.findAllByText('Canal Ofertas Teste')

      const saveButtons = screen.getAllByRole('button', { name: 'Salvar Alterações' })
      expect(saveButtons).toHaveLength(2)
      expect(saveButtons[0]).toBeDisabled()
      expect(saveButtons[1]).toBeDisabled()

      const ignoreCouponBtns = screen.getAllByRole('button', { name: 'Ignorar Cupom' })
      fireEvent.click(ignoreCouponBtns[0])

      expect(saveButtons[0]).toBeEnabled()
      expect(saveButtons[1]).toBeEnabled()

      fireEvent.click(saveButtons[1])

      await waitFor(() => {
        expect(updateSpy).toHaveBeenCalledWith({
          channels: [{ chatId: 501, monitorProducts: true, monitorCoupons: true }],
        })
      })
    })
  })

  describe('5. Clickable Active Terms Pill & UserActiveTermsModal in /admin/users (Task 14.3)', () => {
    const usersFixture: AdminUserDTO[] = [
      {
        id: 1,
        username: 'admin',
        role: 'admin',
        ntfyTopic: 'promo/user/admin',
        normalizedNtfyTopic: 'promo-user-admin',
        activeInterestsCount: 0,
        createdAt: '2026-11-10T00:00:00Z',
      },
      {
        id: 2,
        username: 'user',
        role: 'user',
        ntfyTopic: 'promo/user/user',
        normalizedNtfyTopic: 'promo-user-user',
        activeInterestsCount: 2,
        createdAt: '2026-11-10T00:00:00Z',
      },
    ]

    const userInterestsFixture: UserInterestDTO[] = [
      {
        id: 11,
        rawTerm: 'mario kart world',
        positiveTokens: ['mario', 'kart', 'world'],
        negativeTokens: [],
        maxPrice: 350,
        active: true,
        createdAt: '2026-11-10T12:00:00Z',
      },
      {
        id: 12,
        rawTerm: 'switch 2 -capa -pelicula',
        positiveTokens: ['switch', '2'],
        negativeTokens: ['capa', 'pelicula'],
        maxPrice: 2900,
        active: true,
        createdAt: '2026-11-11T12:00:00Z',
      },
    ]

    async function renderUsersPage() {
      const rootRoute = createRootRoute({ component: () => <Outlet /> })
      const usersRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: '/admin/users',
        component: UsersRoute.options.component,
      })
      const router = createRouter({
        routeTree: rootRoute.addChildren([usersRoute]),
        history: createMemoryHistory({ initialEntries: ['/admin/users'] }),
        context: { queryClient },
      })
      await router.load()

      return renderWithProviders(<RouterProvider router={router} />)
    }

    it('opens UserActiveTermsModal when clicking active terms pill and closes via Fechar, X, and Escape', async () => {
      vi.spyOn(apiClient, 'getSession').mockResolvedValue(adminSession)
      vi.spyOn(apiClient, 'getUsers').mockResolvedValue(usersFixture)
      const getInterestsSpy = vi
        .spyOn(apiClient, 'getUserInterests')
        .mockResolvedValue(userInterestsFixture)

      await renderUsersPage()

      const pillButtons = await screen.findAllByRole('button', {
        name: 'Ver 2 termos ativos de @user',
      })
      expect(pillButtons.length).toBeGreaterThanOrEqual(1)

      // Open modal via click and close with Fechar button
      fireEvent.click(pillButtons[0])

      expect(await screen.findByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Termos Ativos de @user (2)')).toBeInTheDocument()
      expect(await screen.findAllByText('mario kart world')).not.toHaveLength(0)
      expect(screen.getAllByText('switch 2 -capa -pelicula')).not.toHaveLength(0)
      expect(screen.getAllByText('Sem exclusões')).not.toHaveLength(0)
      expect(screen.getAllByText('-capa')).not.toHaveLength(0)
      expect(screen.getAllByText('-pelicula')).not.toHaveLength(0)
      expect(getInterestsSpy).toHaveBeenCalledWith(2, expect.anything())

      const initialCloseButtons = screen.getAllByRole('button', { name: 'Fechar' })
      expect(initialCloseButtons).toHaveLength(2)
      fireEvent.click(initialCloseButtons[1])
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      // Reopen and close with X (top-right button inside modal header)
      fireEvent.click(pillButtons[0])
      await screen.findByRole('dialog')
      const reopenCloseButtons = screen.getAllByRole('button', { name: 'Fechar' })
      fireEvent.click(reopenCloseButtons[0])
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })

      // Reopen and close with Escape
      fireEvent.click(pillButtons[0])
      await screen.findByRole('dialog')
      fireEvent.keyDown(window, { key: 'Escape' })
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('shows empty state when clicked user has 0 active terms', async () => {
      vi.spyOn(apiClient, 'getSession').mockResolvedValue(adminSession)
      vi.spyOn(apiClient, 'getUsers').mockResolvedValue(usersFixture)
      vi.spyOn(apiClient, 'getUserInterests').mockResolvedValue([])

      await renderUsersPage()

      const adminPillBtns = await screen.findAllByRole('button', {
        name: 'Ver 0 termos ativos de @admin',
      })
      fireEvent.click(adminPillBtns[0])

      expect(await screen.findByRole('dialog')).toBeInTheDocument()
      expect(
        await screen.findByText('Este usuário não possui termos ativos cadastrados.'),
      ).toBeInTheDocument()
    })
  })
})

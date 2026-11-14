import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  createMemoryHistory,
} from '@tanstack/react-router'
import { I18nProvider } from '../src/lib/i18n'
import { Route as AuthenticatedRoute } from '../src/routes/_authenticated'
import { Route as DashboardRoute } from '../src/routes/_authenticated/dashboard'
import { Route as OffersRoute } from '../src/routes/_authenticated/offers'
import { Route as AdminChannelsRoute } from '../src/routes/_authenticated/_admin/admin.channels'
import { Route as AdminUsersRoute } from '../src/routes/_authenticated/_admin/admin.users'
import { EmptyState } from '../src/components/ui/EmptyState'
import { PageHeader } from '../src/components/layout/PageHeader'
import { apiClient } from '../src/lib/api/client'
import type {
  AuthSessionResponse,
  DashboardResponse,
  OffersResponse,
  ChannelsListResponse,
  AdminUserDTO,
} from '../src/lib/api/types'

describe('Fase 10: Mobile Responsiveness (Boards 1 to 8 - Mobile)', () => {
  let queryClient: QueryClient

  const mockAdminSession: AuthSessionResponse = {
    authenticated: true,
    needsInitialSetup: false,
    user: { id: 1, username: 'admin', role: 'admin', ntfyTopic: 'promo/user/admin' },
    telegram: { connected: true, phoneMasked: '+55 11 *****-9999', channelsCount: 5 },
  }

  const mockUserSession: AuthSessionResponse = {
    authenticated: true,
    needsInitialSetup: false,
    user: { id: 2, username: 'mateus', role: 'user', ntfyTopic: 'promo/user/mateus' },
    telegram: null,
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  async function renderWithSession(
    session: AuthSessionResponse,
    initialPath = '/dashboard',
    locale: 'pt-BR' | 'en-US' = 'pt-BR',
  ) {
    vi.spyOn(apiClient, 'getSession').mockResolvedValue(session)

    const rootRoute = createRootRoute()
    const authenticatedRoute = createRoute({
      getParentRoute: () => rootRoute,
      id: '_authenticated',
      component: AuthenticatedRoute.options.component,
      beforeLoad: async () => ({ session }),
    })

    const dashboard = createRoute({
      getParentRoute: () => authenticatedRoute,
      path: '/dashboard',
      component: () => <div data-testid="dashboard-content">Dashboard Content</div>,
    })

    const offers = createRoute({
      getParentRoute: () => authenticatedRoute,
      path: '/offers',
      component: () => <div data-testid="offers-content">Offers Content</div>,
    })

    const adminTelegram = createRoute({
      getParentRoute: () => authenticatedRoute,
      path: '/admin/telegram',
      component: () => <div data-testid="admin-telegram-content">Telegram Content</div>,
    })

    const adminChannels = createRoute({
      getParentRoute: () => authenticatedRoute,
      path: '/admin/channels',
      component: () => <div data-testid="admin-channels-content">Channels Content</div>,
    })

    const adminUsers = createRoute({
      getParentRoute: () => authenticatedRoute,
      path: '/admin/users',
      component: () => <div data-testid="admin-users-content">Users Content</div>,
    })

    const login = createRoute({
      getParentRoute: () => rootRoute,
      path: '/login',
      component: () => <div data-testid="login-content">Login Page</div>,
    })

    const routeTree = rootRoute.addChildren([
      authenticatedRoute.addChildren([dashboard, offers, adminTelegram, adminChannels, adminUsers]),
      login,
    ])

    const history = createMemoryHistory({ initialEntries: [initialPath] })
    const router = createRouter({ routeTree, history, context: { queryClient } })
    await router.load()

    return {
      router,
      ...render(
        <QueryClientProvider client={queryClient}>
          <I18nProvider initialLocale={locale}>
            <RouterProvider router={router} />
          </I18nProvider>
        </QueryClientProvider>,
      ),
    }
  }

  describe('Task 10.1: Mobile Navigation in _authenticated.tsx and PageHeader.tsx', () => {
    it('renders Mobile App Header with brand, role subtitle, language switcher and hamburger button', async () => {
      await renderWithSession(mockUserSession)

      // Mobile App Header brand info
      expect(screen.getAllByText('Monitor de Promos')[0]).toBeInTheDocument()
      expect(screen.getAllByText('User Control Center')[0]).toBeInTheDocument()

      // Mobile hamburger button with accessible label
      const menuBtn = screen.getByRole('button', { name: 'Abrir menu de navegação' })
      expect(menuBtn).toBeInTheDocument()
      expect(menuBtn.querySelector('svg')).not.toBeNull()
    })

    it('renders Mobile Navigation Bar with user pills (Meus Termos & Ofertas Encontradas) and quick logout', async () => {
      await renderWithSession(mockUserSession)

      const navBar = screen.getByLabelText('Mobile quick navigation')
      expect(navBar).toBeInTheDocument()

      expect(within(navBar).getByRole('link', { name: 'Meus Termos' })).toBeInTheDocument()
      expect(within(navBar).getByRole('link', { name: 'Ofertas Encontradas' })).toBeInTheDocument()
      expect(within(navBar).getByRole('button', { name: 'Encerrar Sessão' })).toBeInTheDocument()
    })

    it('renders Mobile Navigation Bar with admin pills (Telegram, Canais, Usuários, Termos, Ofertas)', async () => {
      await renderWithSession(mockAdminSession)

      expect(screen.getAllByText('Admin Control Center')[0]).toBeInTheDocument()

      const navBar = screen.getByLabelText('Mobile quick navigation')
      expect(within(navBar).getByRole('link', { name: 'Telegram' })).toBeInTheDocument()
      expect(within(navBar).getByRole('link', { name: 'Canais' })).toBeInTheDocument()
      expect(within(navBar).getByRole('link', { name: 'Usuários' })).toBeInTheDocument()
      expect(within(navBar).getByRole('link', { name: 'Termos' })).toBeInTheDocument()
      expect(within(navBar).getByRole('link', { name: 'Ofertas' })).toBeInTheDocument()
    })

    it('opens slide-over mobile drawer when hamburger button is clicked and closes on Escape', async () => {
      await renderWithSession(mockUserSession)

      const menuBtn = screen.getByRole('button', { name: 'Abrir menu de navegação' })
      fireEvent.click(menuBtn)

      // Drawer dialog is open
      const drawer = screen.getByRole('dialog', { name: 'Menu de navegação' })
      expect(drawer).toBeInTheDocument()

      // Close via Escape key
      fireEvent.keyDown(window, { key: 'Escape' })
      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: 'Menu de navegação' })).not.toBeInTheDocument()
      })
    })

    it('triggers quick logout from mobile navigation bar', async () => {
      const logoutSpy = vi.spyOn(apiClient, 'logout').mockResolvedValue(undefined)
      const { router } = await renderWithSession(mockUserSession)

      const navBar = screen.getByLabelText('Mobile quick navigation')
      const quickLogoutBtn = within(navBar).getByRole('button', { name: 'Encerrar Sessão' })
      fireEvent.click(quickLogoutBtn)

      await waitFor(() => {
        expect(logoutSpy).toHaveBeenCalled()
        expect(router.state.location.pathname).toBe('/login')
      })
    })

    it('PageHeader hides duplicate language switcher on mobile using hidden lg:flex', () => {
      const { container } = render(
        <I18nProvider initialLocale="pt-BR">
          <PageHeader title="Teste de Cabeçalho" />
        </I18nProvider>,
      )

      const switcherWrapper = container.querySelector('.hidden.lg\\:flex')
      expect(switcherWrapper).not.toBeNull()
      expect(screen.getByRole('heading', { name: 'Teste de Cabeçalho' })).toHaveClass('text-lg')
    })
  })

  describe('Task 10.2: EmptyState Mobile Responsiveness', () => {
    it('hides desktop table columns header bar on mobile (< md)', () => {
      const { container } = render(
        <I18nProvider initialLocale="pt-BR">
          <EmptyState type="interests" />
        </I18nProvider>,
      )

      // Desktop table header has hidden md:flex
      const tableHeader = container.querySelector('.hidden.md\\:flex')
      expect(tableHeader).not.toBeNull()

      // Empty state card has responsive padding p-4 sm:p-6
      const emptyCard = screen.getByTestId('empty-state-interests')
      expect(emptyCard).toHaveClass('p-4')
    })
  })

  describe('Task 10.3: Dashboard and Offers Mobile Card Rendering', () => {
    it('renders dashboard monitored terms mobile cards and desktop table simultaneously in DOM', async () => {
      const mockData: DashboardResponse = {
        activeChannelsCount: 3,
        userTopic: 'promo/user/mateus',
        userNormalizedTopic: 'promo-user-mateus',
        userPublicUrl: 'https://ntfy.example.com/promo-user-mateus',
        couponsTopic: 'promo/cupom',
        couponsPublicUrl: 'https://ntfy.example.com/promo-cupom',
        interests: [
          {
            id: 1,
            rawTerm: 'switch 2 -capa',
            positiveTokens: ['switch', '2'],
            negativeTokens: ['capa'],
            maxPrice: 2900,
            active: true,
            createdAt: '2026-03-01T10:00:00Z',
          },
        ],
      }
      vi.spyOn(apiClient, 'getDashboard').mockResolvedValue(mockData)

      const rootRoute = createRootRoute()
      const dashboard = createRoute({
        getParentRoute: () => rootRoute,
        path: '/dashboard',
        component: DashboardRoute.options.component,
      })
      const router = createRouter({
        routeTree: rootRoute.addChildren([dashboard]),
        history: createMemoryHistory({ initialEntries: ['/dashboard'] }),
        context: { queryClient },
      })
      await router.load()

      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <I18nProvider initialLocale="pt-BR">
            <RouterProvider router={router} />
          </I18nProvider>
        </QueryClientProvider>,
      )

      await screen.findAllByText('switch 2 -capa')

      // Verify mobile cards container has md:hidden class
      const mobileList = container.querySelector('.md\\:hidden')
      expect(mobileList).not.toBeNull()

      // Verify desktop table container has hidden md:block class
      const desktopTable = container.querySelector('.hidden.md\\:block')
      expect(desktopTable).not.toBeNull()
    })

    it('renders offers segmented tabs and mobile cards for products and coupons', async () => {
      const mockOffers: OffersResponse = {
        productsCount: 1,
        couponsCount: 1,
        products: [
          {
            id: 1,
            interestId: 10,
            interestTerm: 'ps5',
            channelId: 100,
            channelDisplay: '@promos',
            extractedPrice: 3500,
            formattedPrice: 'R$ 3.500,00',
            messageText: 'PlayStation 5 Slim com 2 jogos',
            offerUrl: 'https://amzn.to/ps5',
            createdAt: '2026-03-01T12:00:00Z',
          },
        ],
        coupons: [
          {
            id: 1,
            code: 'DESCONTO10',
            storeName: 'Amazon',
            storeUrl: 'https://amazon.com',
            channelId: 100,
            channelDisplay: '@cupons',
            messageText: 'Cupom 10% OFF em livros',
            createdAt: '2026-03-01T13:00:00Z',
          },
        ],
      }
      vi.spyOn(apiClient, 'getOffers').mockResolvedValue(mockOffers)

      const rootRoute = createRootRoute()
      const offers = createRoute({
        getParentRoute: () => rootRoute,
        path: '/offers',
        component: OffersRoute.options.component,
      })
      const router = createRouter({
        routeTree: rootRoute.addChildren([offers]),
        history: createMemoryHistory({ initialEntries: ['/offers'] }),
        context: { queryClient },
      })
      await router.load()

      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <I18nProvider initialLocale="pt-BR">
            <RouterProvider router={router} />
          </I18nProvider>
        </QueryClientProvider>,
      )

      await screen.findAllByText('PlayStation 5 Slim com 2 jogos')

      // Segmented tabs have grid grid-cols-2 md:inline-flex
      const tabsGroup = container.querySelector('.grid.grid-cols-2')
      expect(tabsGroup).not.toBeNull()

      // Mobile cards container exists
      const mobileCards = container.querySelector('.md\\:hidden')
      expect(mobileCards).not.toBeNull()
    })
  })

  describe('Task 10.4: Admin Channels and Users Mobile Responsiveness', () => {
    it('renders 3 KPI cards in grid-cols-3 on mobile and side-by-side toggles', async () => {
      const mockChannelsData: ChannelsListResponse = {
        phoneMasked: '+55 11 *****-1234',
        totalChannelsCount: 1,
        couponsTopic: 'promo/cupom',
        adminProductTopic: 'promo/user/admin',
        channels: [
          {
            chatId: 999,
            title: 'Canal Teste',
            username: 'canalteste',
            monitorProducts: true,
            monitorCoupons: false,
            updatedAt: '2026-03-01T00:00:00Z',
          },
        ],
      }
      vi.spyOn(apiClient, 'getChannels').mockResolvedValue(mockChannelsData)

      const rootRoute = createRootRoute()
      const channels = createRoute({
        getParentRoute: () => rootRoute,
        path: '/admin/channels',
        component: AdminChannelsRoute.options.component,
      })
      const router = createRouter({
        routeTree: rootRoute.addChildren([channels]),
        history: createMemoryHistory({ initialEntries: ['/admin/channels'] }),
        context: { queryClient },
      })
      await router.load()

      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <I18nProvider initialLocale="pt-BR">
            <RouterProvider router={router} />
          </I18nProvider>
        </QueryClientProvider>,
      )

      await screen.findAllByText('Canal Teste')

      // 3 KPIs in grid-cols-3
      const kpisGrid = container.querySelector('.grid.grid-cols-3')
      expect(kpisGrid).not.toBeNull()

      // Toggles have 42px height on mobile
      const toggleButtons = container.querySelectorAll('.h-\\[42px\\]')
      expect(toggleButtons.length).toBeGreaterThanOrEqual(2)
    })

    it('renders user cards with side-by-side action buttons on mobile', async () => {
      const mockUsers: AdminUserDTO[] = [
        {
          id: 1,
          username: 'admin',
          role: 'admin',
          ntfyTopic: 'promo/user/admin',
          normalizedNtfyTopic: 'promo-user-admin',
          activeInterestsCount: 3,
          createdAt: '2026-03-01T00:00:00Z',
        },
      ]
      vi.spyOn(apiClient, 'getUsers').mockResolvedValue(mockUsers)
      vi.spyOn(apiClient, 'getSession').mockResolvedValue(mockAdminSession)

      const rootRoute = createRootRoute()
      const usersRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: '/admin/users',
        component: AdminUsersRoute.options.component,
      })
      const router = createRouter({
        routeTree: rootRoute.addChildren([usersRoute]),
        history: createMemoryHistory({ initialEntries: ['/admin/users'] }),
        context: { queryClient },
      })
      await router.load()

      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <I18nProvider initialLocale="pt-BR">
            <RouterProvider router={router} />
          </I18nProvider>
        </QueryClientProvider>,
      )

      await screen.findAllByText('@admin')

      // Mobile cards container exists
      const mobileList = container.querySelector('.md\\:hidden')
      expect(mobileList).not.toBeNull()
      expect(screen.getAllByText('ADMIN')[0]).toBeInTheDocument()
      expect(screen.getAllByText('Protegido')[0]).toBeInTheDocument()
    })
  })
})

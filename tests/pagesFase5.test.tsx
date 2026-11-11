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
} from '@tanstack/react-router'
import { I18nProvider } from '../src/lib/i18n'
import { Route as SetupRoute } from '../src/routes/setup'
import { Route as LoginRoute } from '../src/routes/login'
import { Route as DashboardRoute } from '../src/routes/_authenticated/dashboard'
import { Route as OffersRoute } from '../src/routes/_authenticated/offers'
import { CopyButton } from '../src/components/ui/CopyButton'
import { apiClient, ApiError } from '../src/lib/api/client'
import type { DashboardResponse, OffersResponse } from '../src/lib/api/types'

describe('Fase 5: Public and User Pages (Boards 1, 2, 3, 7)', () => {
  let queryClient: QueryClient

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

  function renderWithProviders(ui: React.ReactElement, locale: 'pt-BR' | 'en-US' = 'pt-BR') {
    return render(
      <QueryClientProvider client={queryClient}>
        <I18nProvider initialLocale={locale}>{ui}</I18nProvider>
      </QueryClientProvider>,
    )
  }

  describe('CopyButton Component', () => {
    it('copies text and provides temporary Copiado! feedback', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(window, 'isSecureContext', {
        value: true,
        configurable: true,
      })
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        configurable: true,
      })

      renderWithProviders(<CopyButton text="https://ntfy.example.com/test" label="Copiar URL" />)

      const btn = screen.getByRole('button', { name: 'Copiar URL' })
      expect(btn).toBeInTheDocument()

      fireEvent.click(btn)

      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalledWith('https://ntfy.example.com/test')
        expect(screen.getByRole('button', { name: 'Copiado!' })).toBeInTheDocument()
      })
    })
  })

  describe('Task 5.1: Setup Page (/setup - Board 1)', () => {
    async function renderSetup() {
      const rootRoute = createRootRoute()
      const setup = createRoute({
        getParentRoute: () => rootRoute,
        path: '/setup',
        component: SetupRoute.options.component,
      })
      const adminTg = createRoute({
        getParentRoute: () => rootRoute,
        path: '/admin/telegram',
        component: () => <div>Admin Telegram Screen</div>,
      })

      const routeTree = rootRoute.addChildren([setup, adminTg])
      const history = createMemoryHistory({ initialEntries: ['/setup'] })
      const router = createRouter({ routeTree, history, context: { queryClient } })
      await router.load()

      return {
        router,
        ...render(
          <QueryClientProvider client={queryClient}>
            <I18nProvider initialLocale="pt-BR">
              <RouterProvider router={router} />
            </I18nProvider>
          </QueryClientProvider>,
        ),
      }
    }

    it('renders Initial Admin Card with title and inputs', async () => {
      await renderSetup()

      expect(screen.getByRole('heading', { name: 'Criar Conta (Administrador)' })).toBeInTheDocument()
      expect(screen.getByLabelText('Usuário')).toHaveValue('admin')
      expect(screen.getByLabelText('Senha')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirmar Senha')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Criar Conta' })).toBeInTheDocument()
    })

    it('validates minimum password length', async () => {
      await renderSetup()

      const passwordInput = screen.getByLabelText('Senha')
      const confirmInput = screen.getByLabelText('Confirmar Senha')
      const submitBtn = screen.getByRole('button', { name: 'Criar Conta' })

      fireEvent.change(passwordInput, { target: { value: '123' } })
      fireEvent.change(confirmInput, { target: { value: '123' } })
      fireEvent.click(submitBtn)

      expect(await screen.findByRole('alert')).toHaveTextContent('A senha deve ter no mínimo 8 caracteres.')
    })

    it('validates password mismatch', async () => {
      await renderSetup()

      const passwordInput = screen.getByLabelText('Senha')
      const confirmInput = screen.getByLabelText('Confirmar Senha')
      const submitBtn = screen.getByRole('button', { name: 'Criar Conta' })

      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmInput, { target: { value: 'mismatch123' } })
      fireEvent.click(submitBtn)

      expect(await screen.findByRole('alert')).toHaveTextContent('As senhas informadas não coincidem.')
    })

    it('submits valid data, calls setup and navigates to /admin/telegram', async () => {
      const setupSpy = vi.spyOn(apiClient, 'setup').mockResolvedValueOnce({
        authenticated: true,
        csrfToken: 'csrf-1',
        needsInitialSetup: false,
        user: { id: 1, username: 'admin', role: 'admin', ntfyTopic: 'promo/user/admin' },
        telegram: { connected: false, phoneMasked: '', channelsCount: 0 },
      })

      const { router } = await renderSetup()

      fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'admin12345' } })
      fireEvent.change(screen.getByLabelText('Confirmar Senha'), { target: { value: 'admin12345' } })
      fireEvent.click(screen.getByRole('button', { name: 'Criar Conta' }))

      await waitFor(() => {
        expect(setupSpy).toHaveBeenCalledWith({
          username: 'admin',
          password: 'admin12345',
          passwordConfirm: 'admin12345',
        })
        expect(router.state.location.pathname).toBe('/admin/telegram')
      })
    })
  })

  describe('Task 5.2: Login Page (/login - Board 2)', () => {
    async function renderLogin() {
      const rootRoute = createRootRoute()
      const login = createRoute({
        getParentRoute: () => rootRoute,
        path: '/login',
        component: LoginRoute.options.component,
      })
      const adminTg = createRoute({
        getParentRoute: () => rootRoute,
        path: '/admin/telegram',
        component: () => <div>Admin Telegram Screen</div>,
      })
      const dashboard = createRoute({
        getParentRoute: () => rootRoute,
        path: '/dashboard',
        component: () => <div>Dashboard Screen</div>,
      })

      const routeTree = rootRoute.addChildren([login, adminTg, dashboard])
      const history = createMemoryHistory({ initialEntries: ['/login'] })
      const router = createRouter({ routeTree, history, context: { queryClient } })
      await router.load()

      return {
        router,
        ...render(
          <QueryClientProvider client={queryClient}>
            <I18nProvider initialLocale="pt-BR">
              <RouterProvider router={router} />
            </I18nProvider>
          </QueryClientProvider>,
        ),
      }
    }

    it('renders Login Card with title and inputs', async () => {
      await renderLogin()

      expect(screen.getByRole('heading', { name: 'Acesso ao Painel' })).toBeInTheDocument()
      expect(screen.getByLabelText('Nome de usuário')).toBeInTheDocument()
      expect(screen.getByLabelText('Senha')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument()
    })

    it('shows error on invalid credentials', async () => {
      vi.spyOn(apiClient, 'login').mockRejectedValueOnce(
        new ApiError(401, 'UNAUTHORIZED', 'Invalid credentials'),
      )

      await renderLogin()

      fireEvent.change(screen.getByLabelText('Nome de usuário'), { target: { value: 'wronguser' } })
      fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'wrongpass' } })
      fireEvent.click(screen.getByRole('button', { name: 'Login' }))

      expect(await screen.findByRole('alert')).toHaveTextContent('Usuário ou senha inválidos.')
    })

    it('redirects admin with disconnected telegram to /admin/telegram', async () => {
      vi.spyOn(apiClient, 'login').mockResolvedValueOnce({
        authenticated: true,
        user: { id: 1, username: 'admin', role: 'admin', ntfyTopic: 'promo/user/admin' },
        telegram: { connected: false, phoneMasked: '', channelsCount: 0 },
      })

      const { router } = await renderLogin()

      fireEvent.change(screen.getByLabelText('Nome de usuário'), { target: { value: 'admin' } })
      fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'correctpassword' } })
      fireEvent.click(screen.getByRole('button', { name: 'Login' }))

      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/admin/telegram')
      })
    })

    it('redirects regular user to /dashboard', async () => {
      vi.spyOn(apiClient, 'login').mockResolvedValueOnce({
        authenticated: true,
        user: { id: 2, username: 'mateus', role: 'user', ntfyTopic: 'promo/user/mateus' },
        telegram: null,
      })

      const { router } = await renderLogin()

      fireEvent.change(screen.getByLabelText('Nome de usuário'), { target: { value: 'mateus' } })
      fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'correctpassword' } })
      fireEvent.click(screen.getByRole('button', { name: 'Login' }))

      await waitFor(() => {
        expect(router.state.location.pathname).toBe('/dashboard')
      })
    })
  })

  describe('Task 5.3: Dashboard Page (/dashboard - Board 3)', () => {
    const mockDashboardData: DashboardResponse = {
      activeChannelsCount: 3,
      userTopic: 'promo/user/mateus',
      userNormalizedTopic: 'promo-user-mateus',
      userPublicUrl: 'https://ntfy.example.com/promo-user-mateus',
      couponsTopic: 'promo/cupom',
      couponsPublicUrl: 'https://ntfy.example.com/promo-cupom',
      interests: [
        {
          id: 1,
          rawTerm: 'Nintendo Switch 2 -capa -pelicula',
          positiveTokens: ['nintendo', 'switch', '2'],
          negativeTokens: ['capa', 'pelicula'],
          maxPrice: 2500,
          active: true,
          createdAt: '2026-11-10T00:00:00Z',
        },
      ],
    }

    async function renderDashboard() {
      const rootRoute = createRootRoute()
      const dashboard = createRoute({
        getParentRoute: () => rootRoute,
        path: '/dashboard',
        component: DashboardRoute.options.component,
      })

      const routeTree = rootRoute.addChildren([dashboard])
      const history = createMemoryHistory({ initialEntries: ['/dashboard'] })
      const router = createRouter({ routeTree, history, context: { queryClient } })
      await router.load()

      return {
        router,
        ...render(
          <QueryClientProvider client={queryClient}>
            <I18nProvider initialLocale="pt-BR">
              <RouterProvider router={router} />
            </I18nProvider>
          </QueryClientProvider>,
        ),
      }
    }

    it('renders Ntfy channels, Add Interest form, and monitored terms list', async () => {
      vi.spyOn(apiClient, 'getDashboard').mockResolvedValueOnce(mockDashboardData)

      await renderDashboard()

      expect(await screen.findByText('Painel do Usuário — Lista de Interesse')).toBeInTheDocument()
      expect(screen.getByText('CANAL DE NOTIFICAÇÕES')).toBeInTheDocument()
      expect(screen.getByText('promo/user/mateus')).toBeInTheDocument()
      expect(screen.getByText('CANAL DE CUPONS')).toBeInTheDocument()
      expect(screen.getByText('promo/cupom')).toBeInTheDocument()

      expect(screen.getAllByText('Nintendo Switch 2 -capa -pelicula')[0]).toBeInTheDocument()
      expect(screen.getAllByText('-capa')[0]).toBeInTheDocument()
      expect(screen.getAllByText('-pelicula')[0]).toBeInTheDocument()
      expect(screen.getAllByText('Até R$ 2.500,00')[0]).toBeInTheDocument()
      expect(screen.getAllByRole('button', { name: 'Remover' })[0]).toBeInTheDocument()
    })

    it('renders EmptyState when interests array is empty', async () => {
      vi.spyOn(apiClient, 'getDashboard').mockResolvedValueOnce({
        ...mockDashboardData,
        interests: [],
      })

      await renderDashboard()

      expect(await screen.findByText('Seus Termos Monitorados (0 ativos)')).toBeInTheDocument()
      expect(screen.getByText('Nenhum termo monitorado cadastrado.')).toBeInTheDocument()
    })

    it('submits new interest', async () => {
      vi.spyOn(apiClient, 'getDashboard').mockResolvedValue(mockDashboardData)
      const addSpy = vi.spyOn(apiClient, 'addInterest').mockResolvedValueOnce({
        id: 2,
        rawTerm: 'RTX 4060',
        positiveTokens: ['rtx', '4060'],
        negativeTokens: [],
        maxPrice: 1800,
        active: true,
        createdAt: '2026-11-10T00:00:00Z',
      })

      await renderDashboard()

      await screen.findByText('Painel do Usuário — Lista de Interesse')

      const termInput = screen.getByPlaceholderText('Ex: switch 2 -capa -pelicula…')
      const priceInput = screen.getByPlaceholderText('Ex: 2800,00…')
      const submitBtn = screen.getByRole('button', { name: '+ Adicionar Interesse' })

      fireEvent.change(termInput, { target: { value: 'RTX 4060' } })
      fireEvent.change(priceInput, { target: { value: '1800,00' } })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(addSpy).toHaveBeenCalledWith({ term: 'RTX 4060', maxPrice: 1800 })
      })
    })

    it('deletes an interest when Remover is clicked', async () => {
      vi.spyOn(apiClient, 'getDashboard').mockResolvedValue(mockDashboardData)
      const deleteSpy = vi.spyOn(apiClient, 'deleteInterest').mockResolvedValueOnce({ success: true })

      await renderDashboard()

      const removeBtns = await screen.findAllByRole('button', { name: 'Remover' })
      fireEvent.click(removeBtns[0])

      await waitFor(() => {
        expect(deleteSpy).toHaveBeenCalledWith(1)
      })
    })
  })

  describe('Task 5.4: Offers Page (/offers - Board 7)', () => {
    const mockOffersData: OffersResponse = {
      productsCount: 1,
      couponsCount: 1,
      products: [
        {
          id: 101,
          interestTerm: 'Nintendo Switch',
          channelDisplay: '@promocoes',
          extractedPrice: 1999,
          formattedPrice: 'R$ 1.999,00',
          messageText: 'Console Nintendo Switch OLED em promoção imperdível!',
          offerUrl: 'https://amzn.to/switch',
          createdAt: '2026-11-10T00:00:00Z',
        },
      ],
      coupons: [
        {
          id: 201,
          code: 'PROMO10OFF',
          storeName: 'Amazon',
          storeUrl: 'https://amazon.com.br',
          messageText: '🎟️ Cupom de 10% OFF na Amazon: PROMO10OFF',
          channelDisplay: '@cupons_brasil',
          createdAt: '2026-11-10T00:00:00Z',
        },
      ],
    }

    async function renderOffers(initialSearch = '') {
      const rootRoute = createRootRoute()
      const offers = createRoute({
        getParentRoute: () => rootRoute,
        path: '/offers',
        validateSearch: OffersRoute.options.validateSearch,
        component: OffersRoute.options.component,
      })

      const routeTree = rootRoute.addChildren([offers])
      const history = createMemoryHistory({ initialEntries: [`/offers${initialSearch}`] })
      const router = createRouter({ routeTree, history, context: { queryClient } })
      await router.load()

      return {
        router,
        ...render(
          <QueryClientProvider client={queryClient}>
            <I18nProvider initialLocale="pt-BR">
              <RouterProvider router={router} />
            </I18nProvider>
          </QueryClientProvider>,
        ),
      }
    }

    it('renders tabs and products table by default', async () => {
      vi.spyOn(apiClient, 'getOffers').mockResolvedValueOnce(mockOffersData)

      await renderOffers()

      expect(await screen.findByText('Ofertas Encontradas')).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Meus Produtos Encontrados (1)' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Cupons Encontrados (1)' })).toBeInTheDocument()

      expect(screen.getAllByText('Console Nintendo Switch OLED em promoção imperdível!')[0]).toBeInTheDocument()
      expect(screen.getAllByText('R$ 1.999,00')[0]).toBeInTheDocument()
      const links = screen.getAllByRole('link', { name: 'Abrir Link' })
      expect(links[0]).toHaveAttribute('href', 'https://amzn.to/switch')
    })

    it('switches to coupons tab when clicked and displays coupons table', async () => {
      vi.spyOn(apiClient, 'getOffers').mockResolvedValue(mockOffersData)

      await renderOffers()

      const couponsTab = await screen.findByRole('tab', { name: 'Cupons Encontrados (1)' })
      fireEvent.click(couponsTab)

      expect((await screen.findAllByText('PROMO10OFF'))[0]).toBeInTheDocument()
      expect(screen.getAllByText('Amazon')[0]).toBeInTheDocument()
      expect(screen.getAllByRole('button', { name: 'Copiar Cupom' })[0]).toBeInTheDocument()
    })

    it('renders EmptyState when products tab is empty', async () => {
      vi.spyOn(apiClient, 'getOffers').mockResolvedValueOnce({
        productsCount: 0,
        couponsCount: 0,
        products: [],
        coupons: [],
      })

      await renderOffers()

      expect(await screen.findByText('Meus Produtos Encontrados (0 registros)')).toBeInTheDocument()
      expect(screen.getByText('Nenhum produto encontrado até o momento.')).toBeInTheDocument()
    })
  })
})

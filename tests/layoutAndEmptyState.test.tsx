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
import { AuthTopBar } from '../src/components/layout/AuthTopBar'
import { PageHeader } from '../src/components/layout/PageHeader'
import { AppSidebar } from '../src/components/layout/AppSidebar'
import { EmptyState } from '../src/components/ui/EmptyState'
import { apiClient } from '../src/lib/api/client'

describe('Layout and Empty State Components (Penpot Boards 1–8)', () => {
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

  async function renderSidebarWithRouter(
    role: 'admin' | 'user',
    username: string,
    locale: 'pt-BR' | 'en-US' = 'pt-BR',
  ) {
    const rootRoute = createRootRoute()
    const indexRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/',
      component: () => <AppSidebar role={role} username={username} />,
    })
    const dummyRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/$any',
      component: () => <div>Dummy</div>,
    })

    const routeTree = rootRoute.addChildren([indexRoute, dummyRoute])
    const history = createMemoryHistory({ initialEntries: ['/'] })
    const router = createRouter({ routeTree, history })
    await router.load()

    return render(
      <QueryClientProvider client={queryClient}>
        <I18nProvider initialLocale={locale}>
          <RouterProvider router={router} />
        </I18nProvider>
      </QueryClientProvider>,
    )
  }

  describe('AuthTopBar (Boards 1 and 2)', () => {
    it('renders default app brand and dark language switcher for Login', () => {
      renderWithProviders(<AuthTopBar />)

      expect(screen.getByText('TELEGRAM MONITOR')).toBeInTheDocument()
      expect(screen.getByRole('group', { name: /Language selection/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'PT' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'EN' })).toBeInTheDocument()
    })

    it('renders initial setup brand when isInitialSetup is true', () => {
      renderWithProviders(<AuthTopBar isInitialSetup={true} />)

      expect(screen.getByText('TELEGRAM MONITOR · INITIAL SETUP')).toBeInTheDocument()
    })

    it('renders custom brand label when explicitly provided', () => {
      renderWithProviders(<AuthTopBar brandLabel="CUSTOM HEADER" />)

      expect(screen.getByText('CUSTOM HEADER')).toBeInTheDocument()
    })
  })

  describe('PageHeader (Boards 3 to 7)', () => {
    it('renders the given title with light language switcher and zero redundant subtitles', () => {
      const { container } = renderWithProviders(<PageHeader title="Painel do Usuário" />)

      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('Painel do Usuário')
      expect(screen.getByRole('button', { name: 'PT' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'EN' })).toBeInTheDocument()

      const paragraphs = container.querySelectorAll('p')
      expect(paragraphs.length).toBe(0)
    })

    it('renders extra action elements when supplied', () => {
      renderWithProviders(
        <PageHeader
          title="Ofertas"
          action={<button type="button">Filtrar</button>}
        />,
      )

      expect(screen.getByRole('button', { name: 'Filtrar' })).toBeInTheDocument()
    })
  })

  describe('AppSidebar (Boards 3, 4, 4b, 5, 6, 7)', () => {
    it('renders user sidebar with User Control Center and exactly 2 nav links for role=user', async () => {
      await renderSidebarWithRouter('user', 'mateus')

      expect(screen.getByText('TELEGRAM MONITOR')).toBeInTheDocument()
      expect(screen.getByText('User Control Center')).toBeInTheDocument()
      expect(screen.getByText('Conectado como: mateus')).toBeInTheDocument()
      expect(screen.getByText('Role: user')).toBeInTheDocument()

      expect(screen.getByRole('link', { name: 'Meus Termos Monitorados' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Ofertas Encontradas' })).toBeInTheDocument()

      expect(screen.queryByRole('link', { name: 'Conexão Telegram' })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Canais Monitorados' })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Gestão de Usuários' })).not.toBeInTheDocument()
    })

    it('renders admin sidebar with Admin Control Center and all 5 nav links for role=admin', async () => {
      await renderSidebarWithRouter('admin', 'adminuser')

      expect(screen.getByText('TELEGRAM MONITOR')).toBeInTheDocument()
      expect(screen.getByText('Admin Control Center')).toBeInTheDocument()
      expect(screen.getByText('Conectado como: adminuser')).toBeInTheDocument()
      expect(screen.getByText('Role: admin')).toBeInTheDocument()

      expect(screen.getByRole('link', { name: 'Conexão Telegram' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Canais Monitorados' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Gestão de Usuários' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Meus Termos Monitorados' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Ofertas Encontradas' })).toBeInTheDocument()
    })

    it('calls logout mutation and navigates when Encerrar Sessão is clicked', async () => {
      const logoutSpy = vi.spyOn(apiClient, 'logout').mockResolvedValueOnce({
        authenticated: false,
        needsInitialSetup: false,
        csrfToken: '',
        user: null,
        telegram: null,
      })

      await renderSidebarWithRouter('user', 'mateus')

      const logoutBtn = screen.getByRole('button', { name: 'Encerrar Sessão' })
      fireEvent.click(logoutBtn)

      await waitFor(() => {
        expect(logoutSpy).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('EmptyState (Board 8: Estados Vazios)', () => {
    it('renders interests empty state in pt-BR', () => {
      renderWithProviders(<EmptyState type="interests" />)

      expect(screen.getByText('Seus Termos Monitorados (0 ativos)')).toBeInTheDocument()
      expect(screen.getByText('TERMO DE INTERESSE')).toBeInTheDocument()
      expect(screen.getByText('REGRAS & EXCLUSÕES')).toBeInTheDocument()
      expect(screen.getByText('PREÇO ALVO')).toBeInTheDocument()
      expect(screen.getByText('AÇÃO')).toBeInTheDocument()
      expect(screen.getByText('Nenhum termo monitorado cadastrado.')).toBeInTheDocument()
    })

    it('renders channels empty state in pt-BR and handles sync CTA', () => {
      const onSyncMock = vi.fn()
      renderWithProviders(<EmptyState type="channels" onSyncChannels={onSyncMock} />)

      expect(screen.getByText('Administração de Canais do Telegram (0 canais)')).toBeInTheDocument()
      expect(screen.getByText('CANAL / GRUPO DO TELEGRAM')).toBeInTheDocument()
      expect(screen.getByText('CHAT ID / @USERNAME')).toBeInTheDocument()
      expect(screen.getByText('PRODUTOS')).toBeInTheDocument()
      expect(screen.getByText('CUPONS')).toBeInTheDocument()
      expect(screen.getByText('Nenhum canal sincronizado na conta.')).toBeInTheDocument()

      const syncBtn = screen.getByRole('button', { name: '↻ Sincronizar Canais da Conta' })
      expect(syncBtn).toBeInTheDocument()
      fireEvent.click(syncBtn)
      expect(onSyncMock).toHaveBeenCalledTimes(1)
    })

    it('renders products empty state in pt-BR', () => {
      renderWithProviders(<EmptyState type="products" />)

      expect(screen.getByText('Meus Produtos Encontrados (0 registros)')).toBeInTheDocument()
      expect(screen.getByText('OFERTA / MENSAGEM')).toBeInTheDocument()
      expect(screen.getByText('TERMO')).toBeInTheDocument()
      expect(screen.getByText('CANAL')).toBeInTheDocument()
      expect(screen.getByText('PREÇO')).toBeInTheDocument()
      expect(screen.getByText('AÇÃO')).toBeInTheDocument()
      expect(screen.getByText('Nenhum produto encontrado até o momento.')).toBeInTheDocument()
    })

    it('renders coupons empty state in pt-BR', () => {
      renderWithProviders(<EmptyState type="coupons" />)

      expect(screen.getByText('Cupons Extraídos (0 registros)')).toBeInTheDocument()
      expect(screen.getByText('CÓDIGO DO CUPOM')).toBeInTheDocument()
      expect(screen.getByText('LOJA')).toBeInTheDocument()
      expect(screen.getByText('REGRA / MENSAGEM')).toBeInTheDocument()
      expect(screen.getByText('CANAL')).toBeInTheDocument()
      expect(screen.getByText('AÇÃO')).toBeInTheDocument()
      expect(screen.getByText('Nenhum cupom encontrado até o momento.')).toBeInTheDocument()
    })

    it('renders all 4 empty state variants in en-US', () => {
      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <I18nProvider initialLocale="en-US">
            <EmptyState type="interests" />
          </I18nProvider>
        </QueryClientProvider>,
      )

      expect(screen.getByText('Your Monitored Terms (0 active)')).toBeInTheDocument()
      expect(screen.getByText('TERM OF INTEREST')).toBeInTheDocument()
      expect(screen.getByText('RULES & EXCLUSIONS')).toBeInTheDocument()
      expect(screen.getByText('TARGET PRICE')).toBeInTheDocument()
      expect(screen.getByText('ACTION')).toBeInTheDocument()
      expect(screen.getByText('No monitored terms registered.')).toBeInTheDocument()

      rerender(
        <QueryClientProvider client={queryClient}>
          <I18nProvider initialLocale="en-US">
            <EmptyState type="channels" onSyncChannels={() => {}} />
          </I18nProvider>
        </QueryClientProvider>,
      )
      expect(screen.getByText('Telegram Channels Administration (0 channels)')).toBeInTheDocument()
      expect(screen.getByText('TELEGRAM CHANNEL / GROUP')).toBeInTheDocument()
      expect(screen.getByText('PRODUCTS')).toBeInTheDocument()
      expect(screen.getByText('COUPONS')).toBeInTheDocument()
      expect(screen.getByText('No channels synchronized on account.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '↻ Synchronize Account Channels' })).toBeInTheDocument()

      rerender(
        <QueryClientProvider client={queryClient}>
          <I18nProvider initialLocale="en-US">
            <EmptyState type="products" />
          </I18nProvider>
        </QueryClientProvider>,
      )
      expect(screen.getByText('My Products Found (0 records)')).toBeInTheDocument()
      expect(screen.getByText('OFFER / MESSAGE')).toBeInTheDocument()
      expect(screen.getByText('PRICE')).toBeInTheDocument()
      expect(screen.getByText('No products found so far.')).toBeInTheDocument()

      rerender(
        <QueryClientProvider client={queryClient}>
          <I18nProvider initialLocale="en-US">
            <EmptyState type="coupons" />
          </I18nProvider>
        </QueryClientProvider>,
      )
      expect(screen.getByText('Extracted Coupons (0 records)')).toBeInTheDocument()
      expect(screen.getByText('COUPON CODE')).toBeInTheDocument()
      expect(screen.getByText('STORE')).toBeInTheDocument()
      expect(screen.getByText('RULE / MESSAGE')).toBeInTheDocument()
      expect(screen.getByText('No coupons found so far.')).toBeInTheDocument()
    })
  })
})

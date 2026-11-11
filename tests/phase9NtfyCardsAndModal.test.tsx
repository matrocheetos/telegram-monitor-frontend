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
import { Route as DashboardRoute } from '../src/routes/_authenticated/dashboard'
import { NtfyInfoModal } from '../src/components/ui/NtfyInfoModal'
import { apiClient } from '../src/lib/api/client'
import type { DashboardResponse } from '../src/lib/api/types'

describe('Fase 9: Ntfy Cards (Copy Topic + SVG i) and NtfyInfoModal', () => {
  let queryClient: QueryClient

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
        rawTerm: 'switch oled',
        positiveTokens: ['switch', 'oled'],
        negativeTokens: ['lite'],
        maxPrice: 2000,
        active: true,
        createdAt: '2026-03-01T10:00:00Z',
      },
    ],
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

  async function renderDashboard(locale: 'pt-BR' | 'en-US' = 'pt-BR') {
    vi.spyOn(apiClient, 'getDashboard').mockResolvedValue(mockDashboardData)

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

    return render(
      <QueryClientProvider client={queryClient}>
        <I18nProvider initialLocale={locale}>
          <RouterProvider router={router} />
        </I18nProvider>
      </QueryClientProvider>,
    )
  }

  describe('Ntfy Channels Row on Dashboard (/dashboard)', () => {
    it('renders both channel cards with topics and public URLs', async () => {
      await renderDashboard()

      expect(await screen.findByText('promo/user/mateus')).toBeInTheDocument()
      expect(screen.getByText('promo/cupom')).toBeInTheDocument()
      expect(screen.getByTitle('https://ntfy.example.com/promo-user-mateus')).toBeInTheDocument()
      expect(screen.getByTitle('https://ntfy.example.com/promo-cupom')).toBeInTheDocument()
    })

    it('renders Info button (SVG icon, no emoji), Copiar Tópico and Copiar URL on both cards', async () => {
      await renderDashboard()

      await screen.findByText('promo/user/mateus')

      // 4 info buttons exist (2 on mobile + 2 on desktop for both cards)
      const infoButtons = screen.getAllByRole('button', {
        name: 'Como configurar notificações no ntfy',
      })
      expect(infoButtons.length).toBeGreaterThanOrEqual(2)

      // Verify buttons do not contain emoji text, only SVG icons
      infoButtons.forEach((btn) => {
        expect(btn.querySelector('svg')).not.toBeNull()
        expect(btn.textContent).toBe('')
      })

      // Check "Copiar Tópico" buttons (one for product, one for coupons)
      const copyTopicButtons = screen.getAllByRole('button', { name: 'Copiar Tópico' })
      expect(copyTopicButtons).toHaveLength(2)

      // Check "Copiar URL" buttons (one for product, one for coupons)
      const copyUrlButtons = screen.getAllByRole('button', { name: 'Copiar URL' })
      expect(copyUrlButtons).toHaveLength(2)
    })

    it('copies normalized topic on Copiar Tópico click and shows confirmation feedback', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true })
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        configurable: true,
      })

      await renderDashboard()
      await screen.findByText('promo/user/mateus')

      const [copyUserTopicBtn, copyCouponsTopicBtn] = screen.getAllByRole('button', {
        name: 'Copiar Tópico',
      })

      // Click user topic copy
      fireEvent.click(copyUserTopicBtn)
      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalledWith('promo-user-mateus')
        expect(screen.getByRole('button', { name: 'Tópico Copiado!' })).toBeInTheDocument()
      })

      // Click coupon topic copy
      fireEvent.click(copyCouponsTopicBtn)
      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalledWith('promo-cupom')
      })
    })

    it('opens NtfyInfoModal in product variant when clicking Info button on User Card', async () => {
      await renderDashboard()
      await screen.findByText('promo/user/mateus')

      const infoButtons = screen.getAllByRole('button', {
        name: 'Como configurar notificações no ntfy',
      })
      // First info button is on the User card
      fireEvent.click(infoButtons[0])

      // Modal opens
      const modal = await screen.findByRole('dialog')
      expect(modal).toBeInTheDocument()
      expect(screen.getByText(/CANAL PÚBLICO DO USUÁRIO/i)).toBeInTheDocument()
      expect(
        screen.getByRole('heading', { name: 'Como receber alertas dos seus produtos no ntfy' }),
      ).toBeInTheDocument()

      // Step 1 app store links
      expect(screen.getByText(/Google Play/i)).toBeInTheDocument()
      expect(screen.getByText(/App Store/i)).toBeInTheDocument()

      // Cross-channel recommendation for coupons
      expect(screen.getByText(/adicione também o canal público de cupons/i)).toBeInTheDocument()

      // Close modal using "Entendi" button
      fireEvent.click(screen.getByRole('button', { name: 'Entendi' }))
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('opens NtfyInfoModal in coupon variant when clicking Info button on Coupons Card', async () => {
      await renderDashboard()
      await screen.findByText('promo/user/mateus')

      const infoButtons = screen.getAllByRole('button', {
        name: 'Como configurar notificações no ntfy',
      })
      // Last info button is on the Coupons card
      fireEvent.click(infoButtons[infoButtons.length - 1])

      const modal = await screen.findByRole('dialog')
      expect(modal).toBeInTheDocument()
      expect(screen.getByText(/CANAL PÚBLICO DE CUPONS/i)).toBeInTheDocument()
      expect(
        screen.getByRole('heading', { name: 'Como receber alertas de cupons no ntfy' }),
      ).toBeInTheDocument()

      // Cross-channel recommendation for user products
      expect(screen.getByText(/adicione também o seu canal público de produtos/i)).toBeInTheDocument()

      // Close modal using Close (X) button
      fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('closes NtfyInfoModal on Escape key press', async () => {
      await renderDashboard()
      await screen.findByText('promo/user/mateus')

      const infoButtons = screen.getAllByRole('button', {
        name: 'Como configurar notificações no ntfy',
      })
      fireEvent.click(infoButtons[0])

      expect(await screen.findByRole('dialog')).toBeInTheDocument()

      fireEvent.keyDown(window, { key: 'Escape' })

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('NtfyInfoModal Component in Isolation', () => {
    it('does not render when isOpen is false', () => {
      const { container } = render(
        <I18nProvider initialLocale="pt-BR">
          <NtfyInfoModal isOpen={false} onClose={vi.fn()} variant="product" />
        </I18nProvider>,
      )
      expect(container.firstChild).toBeNull()
    })

    it('renders with bilingual en-US dictionary support', () => {
      render(
        <I18nProvider initialLocale="en-US">
          <NtfyInfoModal
            isOpen={true}
            onClose={vi.fn()}
            variant="product"
            username="john"
            topic="promo-user-john"
          />
        </I18nProvider>,
      )

      expect(screen.getByText(/USER PUBLIC CHANNEL/i)).toBeInTheDocument()
      expect(
        screen.getByRole('heading', { name: 'How to receive your product alerts on ntfy' }),
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Got it' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Copy Topic' })).toBeInTheDocument()
    })

    it('triggers onClose when clicking the modal backdrop', () => {
      const onCloseMock = vi.fn()
      render(
        <I18nProvider initialLocale="pt-BR">
          <NtfyInfoModal isOpen={true} onClose={onCloseMock} variant="coupon" />
        </I18nProvider>,
      )

      const dialogBackdrop = screen.getByRole('dialog')
      fireEvent.click(dialogBackdrop)

      expect(onCloseMock).toHaveBeenCalledTimes(1)
    })
  })
})

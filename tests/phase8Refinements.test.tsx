import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { I18nProvider, ptBR, enUS } from '../src/lib/i18n'
import { AppSidebar } from '../src/components/layout/AppSidebar'
import { CopyButton } from '../src/components/ui/CopyButton'
import { LanguageSwitcher } from '../src/components/layout/LanguageSwitcher'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  createMemoryHistory,
} from '@tanstack/react-router'

describe('Fase 8: Refinamentos de web-design-guidelines e Internacionalização', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  function renderWithProviders(ui: React.ReactElement, locale: 'pt-BR' | 'en-US' = 'pt-BR') {
    return render(
      <QueryClientProvider client={queryClient}>
        <I18nProvider initialLocale={locale}>{ui}</I18nProvider>
      </QueryClientProvider>,
    )
  }

  async function renderSidebarWithRouter(role: 'admin' | 'user', username: string) {
    const rootRoute = createRootRoute()
    const indexRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: '/',
      component: () => <AppSidebar role={role} username={username} />,
    })
    const routeTree = rootRoute.addChildren([indexRoute])
    const history = createMemoryHistory({ initialEntries: ['/'] })
    const router = createRouter({ routeTree, history, context: { queryClient } })
    await router.load()

    return render(
      <QueryClientProvider client={queryClient}>
        <I18nProvider initialLocale="pt-BR">
          <RouterProvider router={router} />
        </I18nProvider>
      </QueryClientProvider>,
    )
  }

  describe('Task 8.1: Hit Targets, Typography & Acessibilidade', () => {
    it('ensures AppSidebar logout button has 44px hit target (h-11) and focus-visible ring', async () => {
      await renderSidebarWithRouter('admin', 'admin')

      const logoutBtn = screen.getByRole('button', { name: 'Encerrar Sessão' })
      expect(logoutBtn).toHaveClass('h-11')
      expect(logoutBtn).toHaveClass('focus-visible:ring-2')
    })

    it('ensures LanguageSwitcher buttons have accessible focus-visible styles', () => {
      renderWithProviders(<LanguageSwitcher />)

      const ptBtn = screen.getByRole('button', { name: 'PT' })
      const enBtn = screen.getByRole('button', { name: 'EN' })

      expect(ptBtn).toHaveClass('focus-visible:ring-2')
      expect(enBtn).toHaveClass('focus-visible:ring-2')
    })

    it('ensures CopyButton has focus-visible ring styles for blue and green variants', () => {
      const { rerender } = renderWithProviders(
        <CopyButton text="https://test.com" variant="blue" />,
      )
      const blueBtn = screen.getByRole('button', { name: 'Copiar URL' })
      expect(blueBtn).toHaveClass('focus-visible:ring-2')

      rerender(
        <QueryClientProvider client={queryClient}>
          <I18nProvider initialLocale="pt-BR">
            <CopyButton text="CUPOM10" variant="green" />
          </I18nProvider>
        </QueryClientProvider>,
      )
      const greenBtn = screen.getByRole('button', { name: 'Copiar Cupom' })
      expect(greenBtn).toHaveClass('focus-visible:ring-2')
      expect(greenBtn).toHaveClass('focus-visible:ring-emerald-500')
    })
  })

  describe('Task 8.2: Expansão de Dicionários Bilíngues (pt-BR e en-US)', () => {
    it('contains all required Phase 2 translation keys in pt-BR', () => {
      expect(ptBR.common.copyTopic).toBe('Copiar Tópico')
      expect(ptBR.common.topicCopied).toBe('Tópico Copiado!')
      expect(ptBR.common.copyServerUrl).toBe('Copiar URL do Servidor')
      expect(ptBR.common.serverUrlCopied).toBe('Servidor Copiado!')
      expect(ptBR.common.openStore).toBe('Abrir Loja ↗')
      expect(ptBR.aria.ntfyInfoButton).toBe('Como configurar notificações no ntfy')
      expect(ptBR.aria.mobileMenuButton).toBe('Abrir menu de navegação')

      expect(ptBR.ntfyModal.titleProduct).toBe('Como receber alertas dos seus produtos no ntfy')
      expect(ptBR.ntfyModal.titleCoupon).toBe('Como receber alertas de cupons no ntfy')
      expect(ptBR.ntfyModal.badgeCoupons).toBe('CANAL PÚBLICO DE CUPONS (PROMO/CUPOM)')
      expect(ptBR.ntfyModal.badgeUser('mateus')).toBe('CANAL PÚBLICO DO USUÁRIO (PROMO/USER/MATEUS)')
      expect(ptBR.ntfyModal.doneBtn).toBe('Entendi')
    })

    it('contains all required Phase 2 translation keys in en-US', () => {
      expect(enUS.common.copyTopic).toBe('Copy Topic')
      expect(enUS.common.topicCopied).toBe('Topic Copied!')
      expect(enUS.common.copyServerUrl).toBe('Copy Server URL')
      expect(enUS.common.serverUrlCopied).toBe('Server Copied!')
      expect(enUS.common.openStore).toBe('Open Store ↗')
      expect(enUS.aria.ntfyInfoButton).toBe('How to set up ntfy notifications')
      expect(enUS.aria.mobileMenuButton).toBe('Open navigation menu')

      expect(enUS.ntfyModal.titleProduct).toBe('How to receive your product alerts on ntfy')
      expect(enUS.ntfyModal.titleCoupon).toBe('How to receive coupon alerts on ntfy')
      expect(enUS.ntfyModal.badgeCoupons).toBe('PUBLIC COUPONS CHANNEL (PROMO/CUPOM)')
      expect(enUS.ntfyModal.badgeUser('mateus')).toBe('USER PUBLIC CHANNEL (PROMO/USER/MATEUS)')
      expect(enUS.ntfyModal.doneBtn).toBe('Got it')
    })

    it('contains typographical ellipsis (…) in all required placeholders', () => {
      expect(ptBR.dashboard.termPlaceholder).toContain('…')
      expect(ptBR.dashboard.exclusionsPlaceholder).toContain('…')
      expect(ptBR.dashboard.maxPricePlaceholder).toContain('…')
      expect(ptBR.telegram.apiIdPlaceholder).toContain('…')
      expect(ptBR.telegram.apiHashPlaceholder).toContain('…')
      expect(ptBR.channels.searchPlaceholder).toContain('…')
      expect(ptBR.offers.searchPlaceholder).toContain('…')

      expect(enUS.dashboard.termPlaceholder).toContain('…')
      expect(enUS.dashboard.exclusionsPlaceholder).toContain('…')
      expect(enUS.dashboard.maxPricePlaceholder).toContain('…')
      expect(enUS.telegram.apiIdPlaceholder).toContain('…')
      expect(enUS.telegram.apiHashPlaceholder).toContain('…')
      expect(enUS.channels.searchPlaceholder).toContain('…')
      expect(enUS.offers.searchPlaceholder).toContain('…')
    })
  })
})

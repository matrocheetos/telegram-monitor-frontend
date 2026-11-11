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
import { Route as TelegramRoute } from '../src/routes/_authenticated/_admin/admin.telegram'
import { Route as ChannelsRoute } from '../src/routes/_authenticated/_admin/admin.channels'
import { Route as UsersRoute } from '../src/routes/_authenticated/_admin/admin.users'
import { ResetPasswordModal } from '../src/components/ui/ResetPasswordModal'
import { apiClient } from '../src/lib/api/client'
import type {
  TelegramStatusResponse,
  ChannelsResponse,
  AdminUserDTO,
  AuthSessionResponse,
} from '../src/lib/api/types'

describe('Fase 6: Admin Exclusive Pages (Boards 4, 4b, 5, 6)', () => {
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

  describe('ResetPasswordModal Component', () => {
    it('does not render when isOpen is false', () => {
      render(
        <I18nProvider initialLocale="pt-BR">
          <ResetPasswordModal
            isOpen={false}
            username="testuser"
            onClose={vi.fn()}
            onSubmit={vi.fn()}
          />
        </I18nProvider>,
      )

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('renders and validates minLength on submit', () => {
      const submitSpy = vi.fn()
      render(
        <I18nProvider initialLocale="pt-BR">
          <ResetPasswordModal
            isOpen={true}
            username="joaosilva"
            onClose={vi.fn()}
            onSubmit={submitSpy}
          />
        </I18nProvider>,
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Redefinir Senha: @joaosilva')).toBeInTheDocument()

      const input = screen.getByLabelText('Senha')
      const saveBtn = screen.getByRole('button', { name: 'Salvar' })

      fireEvent.change(input, { target: { value: 'short' } })
      fireEvent.click(saveBtn)

      expect(screen.getByText('A senha deve ter no mínimo 8 caracteres.')).toBeInTheDocument()
      expect(submitSpy).not.toHaveBeenCalled()

      fireEvent.change(input, { target: { value: 'ValidPass123' } })
      fireEvent.click(saveBtn)

      expect(submitSpy).toHaveBeenCalledWith('ValidPass123')
    })

    it('calls onClose when Cancelar is clicked', () => {
      const closeSpy = vi.fn()
      render(
        <I18nProvider initialLocale="pt-BR">
          <ResetPasswordModal
            isOpen={true}
            username="joaosilva"
            onClose={closeSpy}
            onSubmit={vi.fn()}
          />
        </I18nProvider>,
      )

      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
      expect(closeSpy).toHaveBeenCalled()
    })
  })

  describe('Task 6.1: Admin Telegram Page (/admin/telegram - Boards 4 & 4b)', () => {
    async function renderTelegramPage() {
      const rootRoute = createRootRoute()
      const tgRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: '/admin/telegram',
        component: TelegramRoute.options.component,
      })
      const channelsRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: '/admin/channels',
        component: () => <div>Admin Channels Screen</div>,
      })

      const routeTree = rootRoute.addChildren([tgRoute, channelsRoute])
      const history = createMemoryHistory({ initialEntries: ['/admin/telegram'] })
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

    it('renders disconnected state (Board 4b) with SESSÃO INATIVA and handles 2-step OTP flow', async () => {
      const disconnectedStatus: TelegramStatusResponse = {
        connected: false,
        phoneMasked: '',
        channelsCount: 0,
      }

      vi.spyOn(apiClient, 'getTelegramStatus').mockResolvedValue(disconnectedStatus)
      const sendCodeSpy = vi.spyOn(apiClient, 'sendTelegramCode').mockResolvedValueOnce({
        phoneCodeHash: 'hash123',
        timeoutSeconds: 300,
      })
      const verifySpy = vi.spyOn(apiClient, 'verifyTelegramCode').mockResolvedValueOnce({
        success: true,
        channelsSynced: 5,
      })

      const { router } = await renderTelegramPage()

      // Board 4b Inactive Session Banner
      expect(await screen.findByText('SESSÃO INATIVA')).toBeInTheDocument()
      expect(screen.getByText('Nenhuma conta conectada')).toBeInTheDocument()
      expect(screen.getByText('Autenticação Pendente')).toBeInTheDocument()

      // Step 1: Fill inputs
      const apiIdInput = screen.getByPlaceholderText('Ex: 12345678…')
      const apiHashInput = screen.getByPlaceholderText('Ex: 0123456789abcdef0123456789abcdef…')
      const phoneInput = screen.getByPlaceholderText('+55 11 99999-9999')
      const sendOtpBtn = screen.getByRole('button', { name: 'Enviar Código de Verificação (OTP)' })

      // Step 2 should initially be disabled
      const otpInput = screen.getByPlaceholderText('Envie o código na Etapa 1 primeiro')
      expect(otpInput).toBeDisabled()

      fireEvent.change(apiIdInput, { target: { value: '123456' } })
      fireEvent.change(apiHashInput, { target: { value: 'abcdef0123456789' } })
      fireEvent.change(phoneInput, { target: { value: '+55 11 99999-8888' } })
      fireEvent.click(sendOtpBtn)

      await waitFor(() => {
        expect(sendCodeSpy).toHaveBeenCalledWith({
          apiId: 123456,
          apiHash: 'abcdef0123456789',
          phone: '+55 11 99999-8888',
        })
      })

      // Step 2 input is now enabled
      await waitFor(() => {
        expect(screen.getByPlaceholderText('12345')).toBeEnabled()
      })

      const codeInput = screen.getByPlaceholderText('12345')
      const password2FAInput = screen.getByPlaceholderText('••••••••••••')
      const connectBtn = screen.getByRole('button', { name: 'Conectar Conta' })

      fireEvent.change(codeInput, { target: { value: '54321' } })
      fireEvent.change(password2FAInput, { target: { value: 'my2faPassword' } })
      fireEvent.click(connectBtn)

      await waitFor(() => {
        expect(verifySpy).toHaveBeenCalledWith({
          phoneCode: '54321',
          password2FA: 'my2faPassword',
        })
        expect(router.state.location.pathname).toBe('/admin/channels')
      })
    })

    it('renders connected state (Board 4) with SESSÃO ATIVA and handles disconnect', async () => {
      const connectedStatus: TelegramStatusResponse = {
        connected: true,
        phoneMasked: '+55 11 *****-8888',
        channelsCount: 8,
      }

      vi.spyOn(apiClient, 'getTelegramStatus').mockResolvedValue(connectedStatus)
      const disconnectSpy = vi.spyOn(apiClient, 'disconnectTelegram').mockResolvedValueOnce({
        success: true,
      })
      vi.spyOn(window, 'confirm').mockReturnValue(true)

      const { router } = await renderTelegramPage()

      // Board 4 Active Session Banner
      expect(await screen.findByText('SESSÃO ATIVA')).toBeInTheDocument()
      expect(screen.getByText('Conta Conectada: +55 11 *****-8888')).toBeInTheDocument()
      expect(screen.getByText('8 canais sincronizados')).toBeInTheDocument()

      // Click "Selecionar Canais"
      const selectBtn = screen.getByRole('button', { name: 'Selecionar Canais' })
      fireEvent.click(selectBtn)
      expect(router.state.location.pathname).toBe('/admin/channels')

      // Click "Desconectar"
      const disconnectBtn = screen.getByRole('button', { name: 'Desconectar' })
      fireEvent.click(disconnectBtn)

      expect(window.confirm).toHaveBeenCalledWith(
        'Deseja realmente desconectar a sessão do Telegram?',
      )
      await waitFor(() => {
        expect(disconnectSpy).toHaveBeenCalled()
      })
    })
  })

  describe('Task 6.2: Admin Channels Page (/admin/channels - Board 5)', () => {
    const mockChannelsData: ChannelsResponse = {
      phoneMasked: '+55 11 *****-8888',
      totalChannelsCount: 3,
      couponsTopic: 'promo/cupom',
      adminProductTopic: 'promo/user/admin',
      channels: [
        {
          chatId: 1001,
          title: 'Promos Brasil VIP',
          username: 'promosbrasil',
          monitorProducts: true,
          monitorCoupons: false,
        },
        {
          chatId: 1002,
          title: 'Achados e Cupons BR',
          username: 'achadoscupons',
          monitorProducts: false,
          monitorCoupons: true,
        },
        {
          chatId: 1003,
          title: 'Grupo de Descontos Tech',
          username: 'descontostech',
          monitorProducts: false,
          monitorCoupons: false,
        },
      ],
    }

    async function renderChannelsPage() {
      const rootRoute = createRootRoute()
      const channelsRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: '/admin/channels',
        component: ChannelsRoute.options.component,
      })

      const routeTree = rootRoute.addChildren([channelsRoute])
      const history = createMemoryHistory({ initialEntries: ['/admin/channels'] })
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

    it('renders 3 KPI cards, channel list, and toggle buttons without icons', async () => {
      vi.spyOn(apiClient, 'getChannels').mockResolvedValue(mockChannelsData)

      await renderChannelsPage()

      // 3 KPI Cards
      expect(await screen.findByText('CONTA TELEGRAM')).toBeInTheDocument()
      expect(screen.getByText('CANAL DE CUPONS')).toBeInTheDocument()
      expect(screen.getByText('CANAL DE PRODUTOS')).toBeInTheDocument()
      expect(screen.getByText('+55 11 *****-8888')).toBeInTheDocument()
      expect(screen.getByText('promo/cupom')).toBeInTheDocument()
      expect(screen.getByText('promo/user/admin')).toBeInTheDocument()

      // Channels rows
      expect(screen.getByText('Promos Brasil VIP')).toBeInTheDocument()
      expect(screen.getAllByText('@promosbrasil')[0]).toBeInTheDocument()
      expect(screen.getByText('Achados e Cupons BR')).toBeInTheDocument()
      expect(screen.getAllByText('@achadoscupons')[0]).toBeInTheDocument()

      // Buttons labels - strictly plain text without checkmarks/icons
      const monitorProdBtns = screen.getAllByRole('button', { name: 'Monitorar Produtos' })
      expect(monitorProdBtns).toHaveLength(1) // channel 1001

      const ignoreProdBtns = screen.getAllByRole('button', { name: 'Ignorar Produtos' })
      expect(ignoreProdBtns).toHaveLength(2) // channels 1002 and 1003

      const monitorCupomBtns = screen.getAllByRole('button', { name: 'Monitorar Cupom' })
      expect(monitorCupomBtns).toHaveLength(1) // channel 1002

      const ignoreCupomBtns = screen.getAllByRole('button', { name: 'Ignorar Cupom' })
      expect(ignoreCupomBtns).toHaveLength(2) // channels 1001 and 1003
    })

    it('toggles channels, enables Salvar Alterações button and submits updates', async () => {
      vi.spyOn(apiClient, 'getChannels').mockResolvedValue(mockChannelsData)
      const updateSpy = vi.spyOn(apiClient, 'updateChannels').mockResolvedValueOnce({
        success: true,
        updatedCount: 3,
      })

      await renderChannelsPage()

      await screen.findByText('Promos Brasil VIP')

      const saveBtn = screen.getByRole('button', { name: 'Salvar Alterações' })
      expect(saveBtn).toBeDisabled()

      // Toggle channel 1003 to monitor products
      const ignoreProdBtns = screen.getAllByRole('button', { name: 'Ignorar Produtos' })
      fireEvent.click(ignoreProdBtns[1]) // channel 1003

      // Now saveBtn should be enabled
      expect(saveBtn).toBeEnabled()
      fireEvent.click(saveBtn)

      await waitFor(() => {
        expect(updateSpy).toHaveBeenCalledWith({
          channels: [
            { chatId: 1001, monitorProducts: true, monitorCoupons: false },
            { chatId: 1002, monitorProducts: false, monitorCoupons: true },
            { chatId: 1003, monitorProducts: true, monitorCoupons: false },
          ],
        })
      })
    })

    it('triggers sync when ↻ Sincronizar Canais da Conta is clicked', async () => {
      vi.spyOn(apiClient, 'getChannels').mockResolvedValue(mockChannelsData)
      const syncSpy = vi.spyOn(apiClient, 'syncChannels').mockResolvedValueOnce({
        success: true,
        syncedChannelsCount: 3,
      })

      await renderChannelsPage()

      const syncBtn = await screen.findByRole('button', { name: '↻ Sincronizar Canais da Conta' })
      fireEvent.click(syncBtn)

      await waitFor(() => {
        expect(syncSpy).toHaveBeenCalled()
      })
    })

    it('filters channel list when search term is typed', async () => {
      vi.spyOn(apiClient, 'getChannels').mockResolvedValue(mockChannelsData)

      await renderChannelsPage()

      await screen.findByText('Promos Brasil VIP')
      expect(screen.getByText('Achados e Cupons BR')).toBeInTheDocument()

      const searchInput = screen.getByPlaceholderText('Filtrar canais por nome ou @username…')
      fireEvent.change(searchInput, { target: { value: 'Tech' } })

      expect(screen.queryByText('Promos Brasil VIP')).not.toBeInTheDocument()
      expect(screen.queryByText('Achados e Cupons BR')).not.toBeInTheDocument()
      expect(screen.getByText('Grupo de Descontos Tech')).toBeInTheDocument()
    })

    it('renders EmptyState when channel list is empty', async () => {
      vi.spyOn(apiClient, 'getChannels').mockResolvedValueOnce({
        phoneMasked: '+55 11 *****-8888',
        totalChannelsCount: 0,
        couponsTopic: 'promo/cupom',
        adminProductTopic: 'promo/user/admin',
        channels: [],
      })

      await renderChannelsPage()

      expect(await screen.findByText('Nenhum canal sincronizado na conta.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '↻ Sincronizar Canais da Conta' })).toBeInTheDocument()
    })
  })

  describe('Task 6.3: Admin Users Page (/admin/users - Board 6)', () => {
    const mockSession: AuthSessionResponse = {
      authenticated: true,
      needsInitialSetup: false,
      user: {
        id: 1,
        username: 'admin',
        role: 'admin',
        ntfyTopic: 'promo/user/admin',
      },
      telegram: {
        connected: true,
        phoneMasked: '+55 11 *****-8888',
      },
    }

    const mockUsers: AdminUserDTO[] = [
      {
        id: 1,
        username: 'admin',
        role: 'admin',
        ntfyTopic: 'promo/user/admin',
        normalizedNtfyTopic: 'promo-user-admin',
        activeInterestsCount: 3,
        createdAt: '2026-11-10T00:00:00Z',
      },
      {
        id: 2,
        username: 'joaosilva',
        role: 'user',
        ntfyTopic: 'promo/user/joaosilva',
        normalizedNtfyTopic: 'promo-user-joaosilva',
        activeInterestsCount: 5,
        createdAt: '2026-11-10T00:00:00Z',
      },
    ]

    async function renderUsersPage() {
      const rootRoute = createRootRoute()
      const usersRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: '/admin/users',
        component: UsersRoute.options.component,
      })

      const routeTree = rootRoute.addChildren([usersRoute])
      const history = createMemoryHistory({ initialEntries: ['/admin/users'] })
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

    it('renders user registration form and submits valid user', async () => {
      vi.spyOn(apiClient, 'getSession').mockResolvedValue(mockSession)
      vi.spyOn(apiClient, 'getUsers').mockResolvedValue(mockUsers)
      const createSpy = vi.spyOn(apiClient, 'createUser').mockResolvedValueOnce({
        id: 3,
        username: 'novousuario',
        role: 'user',
        ntfyTopic: 'promo/user/novousuario',
        normalizedNtfyTopic: 'promo-user-novousuario',
        activeInterestsCount: 0,
        createdAt: '2026-11-10T00:00:00Z',
      })

      await renderUsersPage()

      expect(await screen.findByText('Registrar Novo Usuário')).toBeInTheDocument()

      const usernameInput = screen.getByPlaceholderText('matrocheetos')
      const passwordInput = screen.getByPlaceholderText('••••••••••••')
      const roleSelect = screen.getByRole('combobox')
      const submitBtn = screen.getByRole('button', { name: '+ Criar Usuário' })

      fireEvent.change(usernameInput, { target: { value: 'novousuario' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(roleSelect, { target: { value: 'user' } })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(createSpy).toHaveBeenCalledWith({
          username: 'novousuario',
          password: 'password123',
          role: 'user',
        })
      })
    })

    it('renders users list with role badges and protects currently logged-in admin', async () => {
      vi.spyOn(apiClient, 'getSession').mockResolvedValue(mockSession)
      vi.spyOn(apiClient, 'getUsers').mockResolvedValue(mockUsers)

      await renderUsersPage()

      expect(await screen.findByText('Usuários Cadastrados no Sistema (2)')).toBeInTheDocument()

      // Self admin row
      expect(screen.getByText('@admin')).toBeInTheDocument()
      expect(screen.getByText('ADMIN')).toBeInTheDocument()
      expect(screen.getByText('Protegido')).toBeInTheDocument()

      // Other user row
      expect(screen.getByText('@joaosilva')).toBeInTheDocument()
      expect(screen.getByText('USER')).toBeInTheDocument()
      expect(screen.getByText('5 termos ativos')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Remover' })).toBeInTheDocument()
    })

    it('deletes user after confirmation', async () => {
      vi.spyOn(apiClient, 'getSession').mockResolvedValue(mockSession)
      vi.spyOn(apiClient, 'getUsers').mockResolvedValue(mockUsers)
      const deleteSpy = vi.spyOn(apiClient, 'deleteUser').mockResolvedValueOnce({ success: true })
      vi.spyOn(window, 'confirm').mockReturnValue(true)

      await renderUsersPage()

      const deleteBtn = await screen.findByRole('button', { name: 'Remover' })
      fireEvent.click(deleteBtn)

      expect(window.confirm).toHaveBeenCalledWith(
        'Deseja realmente remover o usuário @joaosilva?',
      )
      await waitFor(() => {
        expect(deleteSpy).toHaveBeenCalledWith(2)
      })
    })

    it('opens reset password modal and submits new password', async () => {
      vi.spyOn(apiClient, 'getSession').mockResolvedValue(mockSession)
      vi.spyOn(apiClient, 'getUsers').mockResolvedValue(mockUsers)
      const resetSpy = vi.spyOn(apiClient, 'resetPassword').mockResolvedValueOnce({ success: true })

      await renderUsersPage()

      const resetBtns = await screen.findAllByRole('button', { name: 'Redefinir Senha' })
      fireEvent.click(resetBtns[1]) // joaosilva

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Redefinir Senha: @joaosilva')).toBeInTheDocument()

      const passInput = screen.getByLabelText('Senha')
      fireEvent.change(passInput, { target: { value: 'NewSecret123' } })

      const saveBtn = screen.getByRole('button', { name: 'Salvar' })
      fireEvent.click(saveBtn)

      await waitFor(() => {
        expect(resetSpy).toHaveBeenCalledWith(2, { password: 'NewSecret123' })
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })
  })
})

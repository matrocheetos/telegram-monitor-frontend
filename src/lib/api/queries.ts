import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'
import type {
  SetupRequest,
  LoginRequest,
  CreateInterestRequest,
  TelegramSendCodeRequest,
  TelegramVerifyRequest,
  UpdateChannelsRequest,
  CreateUserRequest,
  ResetPasswordRequest,
} from './types'

export const authQueries = {
  session: () =>
    queryOptions({
      queryKey: ['auth', 'session'],
      queryFn: ({ signal }) => apiClient.getSession(signal),
      staleTime: 1000 * 60,
    }),
}

export function useLoginMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: LoginRequest) => apiClient.login(data),
    onSuccess: (session) => {
      queryClient.setQueryData(['auth', 'session'], session)
      queryClient.invalidateQueries({ queryKey: ['auth', 'session'] })
    },
  })
}

export function useLogoutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiClient.logout(),
    onSuccess: () => {
      queryClient.clear()
    },
  })
}

export function useSetupMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SetupRequest) => apiClient.setup(data),
    onSuccess: (session) => {
      queryClient.setQueryData(['auth', 'session'], session)
      queryClient.invalidateQueries({ queryKey: ['auth', 'session'] })
    },
  })
}

export const dashboardQueries = {
  data: () =>
    queryOptions({
      queryKey: ['dashboard'],
      queryFn: ({ signal }) => apiClient.getDashboard(signal),
    }),
}

export function useAddInterestMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateInterestRequest) => apiClient.addInterest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteInterestMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiClient.deleteInterest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export const offersQueries = {
  list: (params?: { tab?: string; q?: string }) =>
    queryOptions({
      queryKey: ['offers', params?.tab ?? 'all', params?.q ?? ''],
      queryFn: ({ signal }) => apiClient.getOffers(params, signal),
    }),
}

export const adminQueries = {
  telegram: () =>
    queryOptions({
      queryKey: ['admin', 'telegram'],
      queryFn: ({ signal }) => apiClient.getTelegramStatus(signal),
    }),
  channels: () =>
    queryOptions({
      queryKey: ['admin', 'channels'],
      queryFn: ({ signal }) => apiClient.getChannels(signal),
    }),
  users: () =>
    queryOptions({
      queryKey: ['admin', 'users'],
      queryFn: ({ signal }) => apiClient.getUsers(signal),
    }),
}

export function useTelegramSendCodeMutation() {
  return useMutation({
    mutationFn: (data: TelegramSendCodeRequest) => apiClient.sendTelegramCode(data),
  })
}

export function useTelegramVerifyMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: TelegramVerifyRequest) => apiClient.verifyTelegramCode(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'telegram'] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'session'] })
    },
  })
}

export function useTelegramDisconnectMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiClient.disconnectTelegram(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'telegram'] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'session'] })
    },
  })
}

export function useSyncChannelsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiClient.syncChannels(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'channels'] })
    },
  })
}

export function useUpdateChannelsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateChannelsRequest) => apiClient.updateChannels(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'channels'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateUserRequest) => apiClient.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: ({ userId, data }: { userId: number; data: ResetPasswordRequest }) =>
      apiClient.resetPassword(userId, data),
  })
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => apiClient.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

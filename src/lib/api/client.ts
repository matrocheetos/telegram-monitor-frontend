import {
  ApiError,
  type ApiErrorEnvelope,
  type SessionResponse,
  type SetupRequest,
  type LoginRequest,
  type LoginResponse,
  type UserPayload,
  type DashboardResponse,
  type CreateInterestRequest,
  type UserInterestDTO,
  type OffersResponse,
  type TelegramStatusResponse,
  type TelegramSendCodeRequest,
  type TelegramSendCodeResponse,
  type TelegramVerifyRequest,
  type AdminChannelsResponse,
  type UpdateChannelsRequest,
  type AdminUserDTO,
  type CreateUserRequest,
  type ResetPasswordRequest,
} from './types'

export { ApiError } from './types'

let inMemoryCsrfToken: string | null = null

export function setCsrfToken(token: string | null): void {
  inMemoryCsrfToken = token
}

export function getCsrfToken(): string | null {
  if (inMemoryCsrfToken) return inMemoryCsrfToken

  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/)
    if (match) {
      return decodeURIComponent(match[1])
    }
  }

  return null
}

function getStoredLocale(): string {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(?:^|;\s*)lang=([^;]*)/)
    if (match) return decodeURIComponent(match[1])
  }
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('lang')
    if (saved) return saved
  }
  return 'pt-BR'
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers: customHeaders, ...init } = options

  const apiBase =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
      ? String(import.meta.env.VITE_API_URL).replace(/\/+$/, '')
      : ''

  let url = `${apiBase}${path}`
  if (params) {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        query.append(key, String(value))
      }
    }
    const queryString = query.toString()
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString
    }
  }

  const headers = new Headers(customHeaders)
  if (!headers.has('Accept-Language')) {
    headers.set('Accept-Language', getStoredLocale())
  }

  const method = (init.method || 'GET').toUpperCase()
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)

  if (isMutation) {
    const token = getCsrfToken()
    if (token && !headers.has('X-CSRF-Token')) {
      headers.set('X-CSRF-Token', token)
    }
  }

  if (init.body && typeof init.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, {
    credentials: 'include',
    ...init,
    headers,
  })

  if (!response.ok) {
    let errorCode = 'UNKNOWN_ERROR'
    let errorMessage = `HTTP Error ${response.status}`

    try {
      const data = (await response.json()) as ApiErrorEnvelope
      if (data && data.error) {
        errorCode = data.error.code || errorCode
        errorMessage = data.error.message || errorMessage
      }
    } catch {
      // Fallback for non-JSON responses
    }

    throw new ApiError(response.status, errorCode, errorMessage)
  }

  if (response.status === 204) {
    return undefined as unknown as T
  }

  const data = (await response.json()) as T
  return data
}

export const apiClient = {
  async getSession(signal?: AbortSignal): Promise<SessionResponse> {
    const session = await request<SessionResponse>('/api/v1/auth/session', {
      method: 'GET',
      signal,
    })
    if (session.csrfToken) {
      setCsrfToken(session.csrfToken)
    }
    return session
  },

  async setup(data: SetupRequest): Promise<UserPayload> {
    return request<UserPayload>('/api/v1/setup', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async login(data: LoginRequest): Promise<LoginResponse> {
    return request<LoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async logout(): Promise<void> {
    return request<void>('/api/v1/auth/logout', {
      method: 'POST',
    })
  },

  async getDashboard(signal?: AbortSignal): Promise<DashboardResponse> {
    return request<DashboardResponse>('/api/v1/dashboard', {
      method: 'GET',
      signal,
    })
  },

  async addInterest(data: CreateInterestRequest): Promise<UserInterestDTO> {
    return request<UserInterestDTO>('/api/v1/interests', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async deleteInterest(id: number): Promise<void> {
    return request<void>(`/api/v1/interests/${id}`, {
      method: 'DELETE',
    })
  },

  async getOffers(
    params?: { tab?: string; q?: string },
    signal?: AbortSignal,
  ): Promise<OffersResponse> {
    return request<OffersResponse>('/api/v1/offers', {
      method: 'GET',
      params,
      signal,
    })
  },

  async getTelegramStatus(signal?: AbortSignal): Promise<TelegramStatusResponse> {
    return request<TelegramStatusResponse>('/api/v1/admin/telegram', {
      method: 'GET',
      signal,
    })
  },

  async sendTelegramCode(data: TelegramSendCodeRequest): Promise<TelegramSendCodeResponse> {
    return request<TelegramSendCodeResponse>('/api/v1/admin/telegram/send-code', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async verifyTelegramCode(data: TelegramVerifyRequest): Promise<void> {
    return request<void>('/api/v1/admin/telegram/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async disconnectTelegram(): Promise<void> {
    return request<void>('/api/v1/admin/telegram/disconnect', {
      method: 'POST',
    })
  },

  async getChannels(signal?: AbortSignal): Promise<AdminChannelsResponse> {
    return request<AdminChannelsResponse>('/api/v1/admin/channels', {
      method: 'GET',
      signal,
    })
  },

  async syncChannels(): Promise<void> {
    return request<void>('/api/v1/admin/channels/sync', {
      method: 'POST',
    })
  },

  async updateChannels(data: UpdateChannelsRequest): Promise<void> {
    return request<void>('/api/v1/admin/channels', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async getUsers(signal?: AbortSignal): Promise<AdminUserDTO[]> {
    return request<AdminUserDTO[]>('/api/v1/admin/users', {
      method: 'GET',
      signal,
    })
  },

  async createUser(data: CreateUserRequest): Promise<AdminUserDTO> {
    return request<AdminUserDTO>('/api/v1/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async resetPassword(userId: number, data: ResetPasswordRequest): Promise<void> {
    return request<void>(`/api/v1/admin/users/${userId}/password`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async deleteUser(userId: number): Promise<void> {
    return request<void>(`/api/v1/admin/users/${userId}`, {
      method: 'DELETE',
    })
  },
}

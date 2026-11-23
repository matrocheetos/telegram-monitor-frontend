export type UserRole = 'admin' | 'user'

export interface UserPayload {
  id: number
  username: string
  role: UserRole
  ntfyTopic: string
}

export interface TelegramSessionPayload {
  connected: boolean
  phoneMasked: string
}

export interface SessionResponse {
  needsInitialSetup: boolean
  authenticated: boolean
  csrfToken: string
  user: UserPayload | null
  telegram: TelegramSessionPayload | null
}

export interface SetupRequest {
  username: string
  password: string
  passwordConfirm: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  authenticated: boolean
  csrfToken?: string
  user: UserPayload
  telegram: TelegramSessionPayload | null
}

export interface UserInterestDTO {
  id: number
  rawTerm: string
  positiveTokens: string[]
  negativeTokens: string[]
  maxPrice: number | null
  active: boolean
  createdAt: string
}

export interface CreateInterestRequest {
  term: string
  excludedTerms?: string
  maxPrice: number | null
}

export interface DashboardResponse {
  activeChannelsCount: number
  ntfyBaseUrl?: string
  userTopic: string
  userNormalizedTopic: string
  userPublicUrl: string
  couponsTopic: string
  couponsPublicUrl: string
  interests: UserInterestDTO[]
}

export interface OfferProductDTO {
  id: number
  interestTerm: string
  channelDisplay: string
  extractedPrice: number | null
  formattedPrice: string
  messageText: string
  offerUrl: string
  createdAt: string
}

export interface OfferCouponDTO {
  id: number
  code: string
  storeName: string
  storeUrl: string
  messageText: string
  channelDisplay: string
  createdAt: string
}

export interface OffersResponse {
  productsCount: number
  couponsCount: number
  products: OfferProductDTO[]
  coupons: OfferCouponDTO[]
}

export interface TelegramStatusResponse {
  connected: boolean
  phoneMasked: string
  channelsCount: number
}

export interface TelegramSendCodeRequest {
  apiId: number
  apiHash: string
  phone: string
}

export interface TelegramSendCodeResponse {
  codeSent: boolean
  phoneCodeHash: string
}

export interface TelegramVerifyRequest {
  phoneCode: string
  password2FA: string
}

export interface TelegramChannelDTO {
  chatId: number
  username: string
  title: string
  monitorProducts: boolean
  monitorCoupons: boolean
  updatedAt: string
}

export interface AdminChannelsResponse {
  connected: boolean
  phoneMasked: string
  totalChannelsCount: number
  couponsChannelsCount: number
  productsChannelsCount: number
  adminProductTopic: string
  couponsTopic: string
  channels: TelegramChannelDTO[]
}

export interface UpdateChannelItem {
  chatId: number
  monitorProducts: boolean
  monitorCoupons: boolean
}

export interface UpdateChannelsRequest {
  channels: UpdateChannelItem[]
}

export interface AdminUserDTO {
  id: number
  username: string
  role: UserRole
  ntfyTopic: string
  normalizedNtfyTopic: string
  activeInterestsCount: number
  createdAt: string
}

export interface CreateUserRequest {
  username: string
  password: string
  role: UserRole
}

export interface ResetPasswordRequest {
  password: string
}

export interface ApiErrorDetail {
  code: string
  message: string
}

export interface ApiErrorEnvelope {
  error: ApiErrorDetail
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

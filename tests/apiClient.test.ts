import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient, setCsrfToken, getCsrfToken } from '../src/lib/api/client'
import { ApiError } from '../src/lib/api/types'

describe('ApiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    setCsrfToken(null)
    document.cookie = 'csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    document.cookie = 'lang=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  })

  it('fetches session and saves CSRF token', async () => {
    const mockSession = {
      needsInitialSetup: false,
      authenticated: true,
      csrfToken: 'test-csrf-token-123',
      user: { id: 1, username: 'admin', role: 'admin', ntfyTopic: 'promo/user/admin' },
      telegram: { connected: true, phoneMasked: '+55 11 *****-**11' },
    }

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockSession), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await apiClient.getSession()

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/auth/session',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
      }),
    )
    expect(result).toEqual(mockSession)
    expect(getCsrfToken()).toBe('test-csrf-token-123')
  })

  it('injects X-CSRF-Token on mutating requests (POST, PUT, DELETE)', async () => {
    setCsrfToken('saved-token-abc')

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 10, rawTerm: 'switch 2' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await apiClient.addInterest({ term: 'switch 2', maxPrice: 2500 })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/v1/interests')
    expect(init.method).toBe('POST')
    expect(init.headers.get('X-CSRF-Token')).toBe('saved-token-abc')
    expect(init.headers.get('Content-Type')).toBe('application/json')
    expect(JSON.parse(init.body)).toEqual({ term: 'switch 2', maxPrice: 2500 })
  })

  it('reads CSRF token from document.cookie when available', async () => {
    document.cookie = 'csrf_token=cookie-csrf-456; path=/;'

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(null, {
        status: 204,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await apiClient.deleteInterest(42)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/v1/interests/42')
    expect(init.method).toBe('DELETE')
    expect(init.headers.get('X-CSRF-Token')).toBe('cookie-csrf-456')
  })

  it('throws typed ApiError when API returns structured error response', async () => {
    const errorEnvelope = {
      error: {
        code: 'invalid_credentials',
        message: 'Invalid username or password',
      },
    }

    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify(errorEnvelope), {
          status: 401,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiClient.login({ username: 'bad', password: 'pwd' })).rejects.toThrow(ApiError)

    try {
      await apiClient.login({ username: 'bad', password: 'pwd' })
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      const apiErr = err as ApiError
      expect(apiErr.status).toBe(401)
      expect(apiErr.code).toBe('invalid_credentials')
      expect(apiErr.message).toBe('Invalid username or password')
    }
  })

  it('handles 403 Forbidden and 422 Unprocessable Entity properly', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 'forbidden', message: 'Admin access required' } }), {
        status: 403,
        headers: { 'content-type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(apiClient.getChannels()).rejects.toMatchObject({
      status: 403,
      code: 'forbidden',
      message: 'Admin access required',
    })
  })

  it('sends Accept-Language header matching current language cookie', async () => {
    document.cookie = 'lang=en-US; path=/;'

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ productsCount: 0, couponsCount: 0, products: [], coupons: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await apiClient.getOffers({ tab: 'products', q: 'switch' })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/v1/offers?tab=products&q=switch')
    expect(init.headers.get('Accept-Language')).toBe('en-US')
  })

  it('prefers rotated csrf_token cookie over stale inMemoryCsrfToken', async () => {
    setCsrfToken('stale-pre-login-token')
    document.cookie = 'csrf_token=fresh-rotated-cookie-token; path=/;'

    expect(getCsrfToken()).toBe('fresh-rotated-cookie-token')

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 1, rawTerm: 'switch 2' }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await apiClient.addInterest({ term: 'switch 2', excludedTerms: 'capa', maxPrice: null })

    const [, init] = fetchMock.mock.calls[0]
    expect(init.headers.get('X-CSRF-Token')).toBe('fresh-rotated-cookie-token')
    expect(JSON.parse(init.body)).toEqual({
      term: 'switch 2',
      excludedTerms: 'capa',
      maxPrice: null,
    })
  })

  it('updates CSRF token immediately after login without page reload and clears on logout', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            needsInitialSetup: false,
            authenticated: false,
            csrfToken: 'pre-login-csrf',
            user: null,
            telegram: null,
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            authenticated: true,
            csrfToken: 'post-login-rotated-csrf',
            user: { id: 1, username: 'mateus', role: 'user', ntfyTopic: 'promo/user/mateus' },
            telegram: null,
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 99,
            rawTerm: 'iphone 16e',
            positiveTokens: ['iphone', '16e'],
            negativeTokens: ['capa'],
            maxPrice: 4000,
            active: true,
            createdAt: '2026-11-23T00:00:00Z',
          }),
          { status: 201, headers: { 'content-type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))

    vi.stubGlobal('fetch', fetchMock)

    await apiClient.getSession()
    expect(getCsrfToken()).toBe('pre-login-csrf')

    await apiClient.login({ username: 'mateus', password: 'secret' })
    expect(getCsrfToken()).toBe('post-login-rotated-csrf')

    await apiClient.addInterest({ term: 'iphone 16e', excludedTerms: 'capa', maxPrice: 4000 })
    const [, addInit] = fetchMock.mock.calls[2]
    expect(addInit.headers.get('X-CSRF-Token')).toBe('post-login-rotated-csrf')

    await apiClient.logout()
    expect(getCsrfToken()).toBeNull()
  })

  it('updates CSRF token immediately after initial setup', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          needsInitialSetup: false,
          authenticated: true,
          csrfToken: 'post-setup-rotated-csrf',
          user: { id: 1, username: 'admin', role: 'admin', ntfyTopic: 'promo/user/admin' },
          telegram: { connected: false, phoneMasked: '' },
        }),
        { status: 201, headers: { 'content-type': 'application/json' } },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const session = await apiClient.setup({
      username: 'admin',
      password: 'password123',
      passwordConfirm: 'password123',
    })

    expect(session.csrfToken).toBe('post-setup-rotated-csrf')
    expect(getCsrfToken()).toBe('post-setup-rotated-csrf')
  })
})

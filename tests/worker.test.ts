/// <reference path="../worker-configuration.d.ts" />
import { describe, it, expect, vi, beforeEach } from 'vitest'
import worker from '../src/worker'

describe('Worker API Proxy', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('forwards /api/* requests to BACKEND_ORIGIN preserving method, headers and query params', async () => {
    const mockResponse = new Response(JSON.stringify({ authenticated: true }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'set-cookie': 'session=abc; Path=/; HttpOnly',
      },
    })

    const fetchMock = vi.fn().mockResolvedValue(mockResponse)
    vi.stubGlobal('fetch', fetchMock)

    const env: Env = {
      BACKEND_ORIGIN: 'http://localhost:8080',
      ASSETS: { fetch: vi.fn() } as unknown as Fetcher,
    }

    const request = new Request('https://frontend.example.com/api/v1/auth/session?foo=bar', {
      method: 'POST',
      headers: {
        cookie: 'session=123',
        'x-csrf-token': 'csrf-xyz',
        'accept-language': 'pt-BR',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ test: 123 }),
    })

    const response = await worker.fetch(request, env)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [targetUrl, options] = fetchMock.mock.calls[0]

    expect(targetUrl).toBe('http://localhost:8080/api/v1/auth/session?foo=bar')
    expect(options.method).toBe('POST')
    expect(options.headers.get('cookie')).toBe('session=123')
    expect(options.headers.get('x-csrf-token')).toBe('csrf-xyz')
    expect(options.headers.get('accept-language')).toBe('pt-BR')
    expect(options.headers.get('content-type')).toBe('application/json')
    expect(options.headers.get('host')).toBe('localhost:8080')

    expect(response.status).toBe(200)
    expect(response.headers.get('set-cookie')).toBe('session=abc; Path=/; HttpOnly')
    const body = await response.json()
    expect(body).toEqual({ authenticated: true })
  })

  it('returns 502 with structured error envelope when backend is unreachable', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Connection refused'))
    vi.stubGlobal('fetch', fetchMock)

    const env: Env = {
      BACKEND_ORIGIN: 'http://localhost:8080',
      ASSETS: { fetch: vi.fn() } as unknown as Fetcher,
    }

    const request = new Request('https://frontend.example.com/api/v1/status', {
      method: 'GET',
    })

    const response = await worker.fetch(request, env)

    expect(response.status).toBe(502)
    expect(response.headers.get('content-type')).toContain('application/json')
    const data = await response.json()
    expect(data).toEqual({
      error: {
        code: 'BAD_GATEWAY',
        message: 'Backend service unreachable',
      },
    })
  })

  it('delegates non-API requests to env.ASSETS', async () => {
    const assetsMock = {
      fetch: vi.fn().mockResolvedValue(new Response('HTML content', { status: 200 })),
    }

    const env: Env = {
      BACKEND_ORIGIN: 'http://localhost:8080',
      ASSETS: assetsMock as unknown as Fetcher,
    }

    const request = new Request('https://frontend.example.com/dashboard', {
      method: 'GET',
    })

    const response = await worker.fetch(request, env)

    expect(assetsMock.fetch).toHaveBeenCalledWith(request)
    expect(response.status).toBe(200)
    const text = await response.text()
    expect(text).toBe('HTML content')
  })
})

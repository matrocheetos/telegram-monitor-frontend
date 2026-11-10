export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/api/')) {
      const backendOrigin = (env.BACKEND_ORIGIN || 'http://localhost:8080').replace(/\/+$/, '')
      const targetUrl = new URL(url.pathname + url.search, backendOrigin)

      const forwardHeaders = new Headers(request.headers)
      forwardHeaders.set('host', targetUrl.host)

      const clientIp = request.headers.get('cf-connecting-ip')
      if (clientIp) {
        forwardHeaders.set('x-forwarded-for', clientIp)
      }

      const hasBody =
        request.method !== 'GET' &&
        request.method !== 'HEAD' &&
        request.body !== null

      try {
        const backendResponse = await fetch(targetUrl.toString(), {
          method: request.method,
          headers: forwardHeaders,
          body: hasBody ? request.body : undefined,
          redirect: 'manual',
        })

        const responseHeaders = new Headers(backendResponse.headers)
        if (typeof backendResponse.headers.getSetCookie === 'function') {
          const cookies = backendResponse.headers.getSetCookie()
          if (cookies.length > 1) {
            responseHeaders.delete('set-cookie')
            for (const cookie of cookies) {
              responseHeaders.append('set-cookie', cookie)
            }
          }
        }

        return new Response(backendResponse.body, {
          status: backendResponse.status,
          statusText: backendResponse.statusText,
          headers: responseHeaders,
        })
      } catch (error) {
        console.error(
          JSON.stringify({
            level: 'error',
            message: 'Backend proxy request failed',
            error: error instanceof Error ? error.message : String(error),
            targetUrl: targetUrl.toString(),
            method: request.method,
          }),
        )

        return new Response(
          JSON.stringify({
            error: {
              code: 'BAD_GATEWAY',
              message: 'Backend service unreachable',
            },
          }),
          {
            status: 502,
            headers: {
              'content-type': 'application/json; charset=utf-8',
            },
          },
        )
      }
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request)
    }

    return new Response('Not found', { status: 404 })
  },
} satisfies ExportedHandler<Env>

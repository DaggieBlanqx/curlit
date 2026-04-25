import { createProxyMiddleware } from 'http-proxy-middleware'

/**
 * Create a proxy middleware that forwards all requests to the target server.
 *
 * @param {string} target - The target server URL e.g. http://localhost:8080
 * @param {object} options - Optional overrides for http-proxy-middleware
 * @returns Express-compatible middleware
 */
export function createProxy (target, options = {}) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    ws: true, // forward WebSocket upgrades too

    // We handle the response ourselves so we can buffer the body
    // and store it for cUrlit to capture before sending to the client.
    selfHandleResponse: true,

    on: {
      proxyReq (proxyReq, req) {
        // Express body parsers consume the raw request stream before the proxy
        // gets to forward it. Once the stream is consumed, http-proxy-middleware
        // has nothing to send to the target server — so the body silently
        // disappears. We fix this by manually re-writing the parsed body back
        // onto the outgoing proxy request.
        if (!req.body || Object.keys(req.body).length === 0) return

        const contentType = (req.headers['content-type'] || '').toLowerCase()
        let bodyData

        if (contentType.includes('application/json')) {
          bodyData = JSON.stringify(req.body)
          proxyReq.setHeader('Content-Type', 'application/json')
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          bodyData = new URLSearchParams(req.body).toString()
          proxyReq.setHeader('Content-Type', 'application/x-www-form-urlencoded')
        } else {
          // Fallback — stringify whatever we have
          bodyData = JSON.stringify(req.body)
          proxyReq.setHeader('Content-Type', 'application/json')
        }

        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData))
        proxyReq.write(bodyData)
      },

      proxyRes (proxyRes, req, res) {
        // Buffer the full response body before sending to the client.
        // With selfHandleResponse: true we own the response entirely —
        // http-proxy-middleware has not written anything yet.
        const chunks = []
        proxyRes.on('data', (chunk) => chunks.push(chunk))
        proxyRes.on('end', () => {
          const body = Buffer.concat(chunks)
          const bodyStr = body.toString('utf8')

          // Write status
          res.statusCode = proxyRes.statusCode

          // Forward headers — skip transfer-encoding since we're sending
          // the full buffered body, not a chunked stream
          Object.entries(proxyRes.headers).forEach(([key, value]) => {
            if (key.toLowerCase() === 'transfer-encoding') return
            if (value !== undefined) res.setHeader(key, value)
          })

          // Stash the body string on req so cUrlit's capture function
          // can read it — res.end triggers cUrlit's patched res.end,
          // but the raw Buffer argument isn't as useful as the string
          req.__curlitProxyBody = bodyStr

          // End the response — this triggers cUrlit's patched res.end
          res.end(body)
        })
      },

      error (err, req, res) {
        console.error(`[curlit-proxy] Failed to proxy ${req.method} ${req.url} → ${target}`)
        console.error(`[curlit-proxy] ${err.message}`)

        if (res.headersSent) return

        res.status(502).json({
          error: 'Bad Gateway',
          message: `cUrlit could not reach the target server at ${target}`,
          detail: err.message
        })
      }
    },

    ...options
  })
}

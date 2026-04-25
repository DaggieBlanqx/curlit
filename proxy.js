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

    on: {
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

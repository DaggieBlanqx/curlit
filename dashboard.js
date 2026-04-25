import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Read and cache the HTML at startup, injecting the dashboard path at runtime.
const HTML_TEMPLATE = fs.readFileSync(
  path.join(__dirname, 'dashboard.html'),
  'utf-8'
)

/**
 * Inject the configured dashboardPath into the HTML so the client-side
 * JS knows where to point its SSE and fetch calls.
 */
function buildHTML (dashboardPath) {
  return HTML_TEMPLATE.replace(
    '// Dashboard path is injected by the server',
    `// Dashboard path is injected by the server\n  window.__CURLIT_PATH__ = ${JSON.stringify(dashboardPath)}`
  )
}

/**
 * Create a router that handles all /_curlit/* routes.
 *
 * @param {import('./ring-buffer.js').RingBuffer} buffer
 * @param {{ dashboardPath: string }} options
 * @returns Express-compatible middleware
 */
export function createDashboardRouter (buffer, options) {
  const { dashboardPath } = options
  const sseClients = new Set()
  const html = buildHTML(dashboardPath)

  // Push new entries to all connected SSE clients
  buffer.subscribe((entry) => {
    const payload = `data: ${JSON.stringify({ type: 'request', data: entry })}\n\n`
    for (const client of sseClients) {
      try {
        client.write(payload)
      } catch {
        sseClients.delete(client)
      }
    }
  })

  return function dashboardRouter (req, res, next) {
    const url = req.url || req.originalUrl

    // Dashboard UI
    if (url === dashboardPath || url === dashboardPath + '/') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      return res.end(html)
    }

    // SSE stream
    if (url === dashboardPath + '/stream') {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      res.flushHeaders()

      // Send current buffer as init payload
      const init = `data: ${JSON.stringify({ type: 'init', data: buffer.all() })}\n\n`
      res.write(init)

      sseClients.add(res)
      req.on('close', () => sseClients.delete(res))
      return
    }

    // Clear buffer
    if (url === dashboardPath + '/clear' && req.method === 'POST') {
      buffer.clear()
      res.end('ok')
      return
    }

    next()
  }
}

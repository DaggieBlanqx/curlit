import { DEFAULT_OPTIONS, DEFAULT_REDACTED_HEADERS, DEFAULT_AUTO_HEADERS } from './defaults.js'
import { buildCurlCommand, formatResponseBody } from './helpers.js'
import { RingBuffer } from './ring-buffer.js'
import { createDashboardRouter } from './dashboard/dashboard.js'

/**
 * Create a curlit middleware instance.
 *
 * @param {Partial<typeof DEFAULT_OPTIONS>} userOptions
 * @returns {import('express').RequestHandler}
 *
 * @example
 * // Zero config — active in development/test, dashboard at /_curlit
 * app.use(curlit())
 *
 * @example
 * // Always on, custom redact list, no dashboard
 * app.use(curlit({
 *   enabledEnvs: null,
 *   dashboard: false,
 *   redactedHeaders: new Set(['authorization', 'x-secret']),
 * }))
 */
function curlit (userOptions = {}) {
  const options = { ...DEFAULT_OPTIONS, ...userOptions }

  const env = process.env.NODE_ENV || 'development'
  const isEnabled = options.enabledEnvs === null || options.enabledEnvs.includes(env)

  const buffer = new RingBuffer(options.bufferSize)
  const dashboardRouter = options.dashboard
    ? createDashboardRouter(buffer, options)
    : null

  return function curlitMiddleware (req, res, next) {
    if (!isEnabled) return next()

    // Hand off dashboard routes without logging them
    if (options.dashboard && (req.originalUrl || req.url).startsWith(options.dashboardPath)) {
      return dashboardRouter(req, res, next)
    }

    const { logger, maxBodyLength, logResponseBody } = options
    const timestamp = new Date().toISOString()

    function capture (body) {
      // In proxy mode, http-proxy-middleware uses res.end directly and never
      // calls res.send — so the body argument here may be a raw Buffer or
      // empty. proxy.js stashes the decoded string on req.__curlitProxyBody
      // just before calling res.end so we can read it here instead.
      const resolvedBody = req.__curlitProxyBody || body

      const curl = buildCurlCommand(req, options)
      const responseBody = typeof resolvedBody === 'string'
        ? resolvedBody
        : Buffer.isBuffer(resolvedBody)
          ? resolvedBody.toString()
          : resolvedBody
            ? JSON.stringify(resolvedBody)
            : '(empty)'

      // Push to ring buffer for the dashboard
      buffer.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp,
        method: req.method,
        url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
        status: res.statusCode,
        headers: req.headers,
        curl,
        responseBody
      })

      // Console output
      const sep = '─'.repeat(60)
      let output = `\n${sep}\n[curlit] ${timestamp}\n${sep}\n\n${curl}\n`
      if (logResponseBody) {
        output += `\n── Response (${res.statusCode}) ${'─'.repeat(40)}\n`
        output += formatResponseBody(resolvedBody, maxBodyLength) + '\n'
      }
      output += sep
      logger(output)
    }

    // Guard against double capture — whichever of res.send or res.end
    // fires first sets this to true so the other one skips capture.
    // This matters in proxy mode where http-proxy-middleware calls res.end
    // directly, and in normal Express mode where res.send internally
    // calls res.end after already having called capture.
    let captured = false

    // Patch res.send (covers res.json and most normal Express responses)
    const originalSend = res.send.bind(res)
    res.send = function (body) {
      if (!captured) {
        captured = true
        capture(body)
      }
      return originalSend(body)
    }

    // Patch res.end (covers proxy responses which call res.end directly,
    // bypassing res.send entirely)
    const originalEnd = res.end.bind(res)
    res.end = function (chunk, encoding, callback) {
      if (!captured) {
        captured = true
        capture(chunk)
      }
      return originalEnd(chunk, encoding, callback)
    }

    // Patch res.sendFile (completely bypasses send/end)
    if (res.sendFile) {
      const originalSendFile = res.sendFile.bind(res)
      res.sendFile = function (filePath, ...args) {
        logger(`\n[curlit] ${timestamp} — res.sendFile: ${filePath} (body logging skipped)\n`)
        return originalSendFile(filePath, ...args)
      }
    }

    next()
  }
}

export default curlit
export { DEFAULT_REDACTED_HEADERS, DEFAULT_AUTO_HEADERS }

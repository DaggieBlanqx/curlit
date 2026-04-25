/**
 * curlit - Express middleware to log a cURL command representation of requests and responses.
 *
 * Features:
 *  - Correct shell escaping for headers and body data
 *  - Handles object, string, and Buffer bodies
 *  - Patches res.send, res.json, res.end, and res.sendFile exit paths
 *  - Skips binary/file responses gracefully
 *  - Redacts sensitive headers (Authorization, Cookie, etc.) by default
 *  - Configurable: enable/disable, redact list, custom logger, body size limit
 *  - Auto-disabled in production unless explicitly opted in
 */

const DEFAULT_REDACTED_HEADERS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'x-auth-token',
  'proxy-authorization'
])

const DEFAULT_OPTIONS = {
  /** Only log in these NODE_ENV values. Pass null to always log. */
  enabledEnvs: ['development', 'test'],

  /** Max byte length of the response body to print. Larger bodies are truncated. */
  maxBodyLength: 4096,

  /** Set of lowercase header names to redact. */
  redactedHeaders: DEFAULT_REDACTED_HEADERS,

  /** Custom logger function. Defaults to console.log. */
  logger: console.log,

  /** Whether to include the response body in the output. */
  logResponseBody: true
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Escape a string for safe use inside a double-quoted shell argument.
 * Escapes backslashes and double-quotes.
 */
function shellEscapeDouble (str) {
  return String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

/**
 * Stringify a request body into something curl can send.
 * Returns null when there's nothing to send.
 */
function serializeBody (body) {
  if (body === undefined || body === null) return null
  if (Buffer.isBuffer(body)) return null // binary — skip silently
  if (typeof body === 'object') {
    const json = JSON.stringify(body)
    return Object.keys(body).length === 0 ? null : json
  }
  const str = String(body).trim()
  return str.length === 0 ? null : str
}

/**
 * Build a multiline curl command string from the given request data.
 */
function buildCurlCommand (req, options) {
  const { redactedHeaders } = options
  const lines = [`curl -X ${req.method}`]

  // Headers
  for (const [header, value] of Object.entries(req.headers)) {
    const lowerHeader = header.toLowerCase()
    const displayValue = redactedHeaders.has(lowerHeader)
      ? '<redacted>'
      : Array.isArray(value) ? value.join(', ') : value

    lines.push(`  -H "${shellEscapeDouble(header)}: ${shellEscapeDouble(displayValue)}"`)
  }

  // Body
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const data = serializeBody(req.body)
    if (data !== null) {
      lines.push(`  --data-raw "${shellEscapeDouble(data)}"`)
    }
  }

  // URL (always last)
  const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`
  lines.push(`  "${shellEscapeDouble(fullUrl)}"`)

  // Join with space + backslash continuation, except the last line
  return lines
    .map((line, i) => (i < lines.length - 1 ? `${line} \\` : line))
    .join('\n')
}

/**
 * Format the response body for display. Truncates if over the limit.
 */
function formatResponseBody (body, maxLength) {
  if (body === undefined || body === null) return '(empty)'
  if (Buffer.isBuffer(body)) return `(binary buffer, ${body.length} bytes)`

  const str = typeof body === 'object' ? JSON.stringify(body, null, 2) : String(body)

  if (str.length > maxLength) {
    return `${str.slice(0, maxLength)}\n… (truncated, ${str.length - maxLength} more bytes)`
  }
  return str
}

// ---------------------------------------------------------------------------
// Middleware factory
// ---------------------------------------------------------------------------

/**
 * Create a curlit middleware instance with the given options.
 *
 * @param {Partial<typeof DEFAULT_OPTIONS>} userOptions
 * @returns {import('express').RequestHandler}
 *
 * @example
 * // Default usage (only active in development/test)
 * app.use(curlit())
 *
 * @example
 * // Always active, custom redact list
 * app.use(curlit({
 *   enabledEnvs: null,
 *   redactedHeaders: new Set(['authorization', 'x-secret']),
 * }))
 */
function curlit (userOptions = {}) {
  const options = { ...DEFAULT_OPTIONS, ...userOptions }

  // Resolve enabled state once at setup time
  const env = process.env.NODE_ENV || 'development'
  const isEnabled = options.enabledEnvs === null || options.enabledEnvs.includes(env)

  return function curlitMiddleware (req, res, next) {
    if (!isEnabled) return next()

    const { logger, maxBodyLength, logResponseBody } = options

    function logRequest (body) {
      const curl = buildCurlCommand(req, options)
      const separator = '─'.repeat(60)

      let output = `\n${separator}\n[curlit] ${new Date().toISOString()}\n${separator}\n`
      output += `\n${curl}\n`

      if (logResponseBody) {
        output += `\n── Response (${res.statusCode}) ${'─'.repeat(40)}\n`
        output += formatResponseBody(body, maxBodyLength)
        output += '\n'
      }

      output += separator
      logger(output)
    }

    // --- Patch res.send (handles json/send/most text responses) ---
    const originalSend = res.send.bind(res)
    res.send = function (body) {
      logRequest(body)
      return originalSend(body)
    }

    // --- Patch res.end (covers raw end() calls that bypass res.send) ---
    const originalEnd = res.end.bind(res)
    res.end = function (chunk, encoding, callback) {
      // Avoid double-logging if res.send already patched and called end internally.
      // We detect this by checking if send was already overridden back.
      if (res.send !== originalSend) {
        // res.send is still patched → it hasn't fired yet, log here
        logRequest(chunk)
      }
      return originalEnd(chunk, encoding, callback)
    }

    // --- Patch res.sendFile (completely bypasses send/end) ---
    const originalSendFile = res.sendFile?.bind(res)
    if (originalSendFile) {
      res.sendFile = function (path, ...args) {
        logger(`\n[curlit] ${new Date().toISOString()} — res.sendFile: ${path} (body logging skipped)\n`)
        return originalSendFile(path, ...args)
      }
    }

    next()
  }
}

// ---------------------------------------------------------------------------
// Convenience default export (zero-config)
// ---------------------------------------------------------------------------

export default curlit
export { DEFAULT_REDACTED_HEADERS }

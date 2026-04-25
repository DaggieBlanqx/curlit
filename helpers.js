/**
 * Escape a string for safe use inside a double-quoted shell argument.
 * Escapes backslashes and double-quotes.
 */
export function shellEscapeDouble (str) {
  return String(str).replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

/**
 * Stringify a request body into something curl can send.
 * Returns null when there is nothing meaningful to send.
 */
export function serializeBody (body) {
  if (body === undefined || body === null) return null
  if (Buffer.isBuffer(body)) return null
  if (typeof body === 'object') {
    const json = JSON.stringify(body)
    return Object.keys(body).length === 0 ? null : json
  }
  const str = String(body).trim()
  return str.length === 0 ? null : str
}

/**
 * Build a multiline curl command string from the given request and options.
 */
export function buildCurlCommand (req, options) {
  const { redactedHeaders } = options
  const isWindows = process.platform === 'win32'
  const continuation = isWindows ? ' `' : ' \\'
  const lines = [`curl -X ${req.method}`]

  for (const [header, value] of Object.entries(req.headers)) {
    const lowerHeader = header.toLowerCase()
    const displayValue = redactedHeaders.has(lowerHeader)
      ? '<redacted>'
      : Array.isArray(value) ? value.join(', ') : value

    lines.push(`  -H "${shellEscapeDouble(header)}: ${shellEscapeDouble(displayValue)}"`)
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const data = serializeBody(req.body)
    if (data !== null) {
      lines.push(`  --data-raw "${shellEscapeDouble(data)}"`)
    }
  }

  const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`
  lines.push(`  "${shellEscapeDouble(fullUrl)}"`)

  return lines
    .map((line, i) => (i < lines.length - 1 ? `${line}${continuation}` : line))
    .join('\n')
}

/**
 * Format a response body for console display.
 * Truncates if over the configured limit.
 */
export function formatResponseBody (body, maxLength) {
  if (body === undefined || body === null) return '(empty)'
  if (Buffer.isBuffer(body)) return `(binary buffer, ${body.length} bytes)`

  const str = typeof body === 'object'
    ? JSON.stringify(body, null, 2)
    : String(body)

  if (str.length > maxLength) {
    return `${str.slice(0, maxLength)}\n… (truncated, ${str.length - maxLength} more bytes)`
  }

  return str
}

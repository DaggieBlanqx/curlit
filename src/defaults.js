export const DEFAULT_REDACTED_HEADERS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'x-auth-token',
  'proxy-authorization'
])

export const DEFAULT_AUTO_HEADERS = new Set([
  'host',
  'user-agent',
  'accept',
  'accept-encoding',
  'connection',
  'content-length',
  'transfer-encoding'
])

export const DEFAULT_OPTIONS = {
  /** Only log in these NODE_ENV values. Pass null to always log. */
  enabledEnvs: ['development', 'test'],

  /** Max byte length of the response body to print. Larger bodies are truncated. */
  maxBodyLength: 4096,

  /** Set of lowercase header names to redact. */
  redactedHeaders: DEFAULT_REDACTED_HEADERS,

  /** Set of lowercase header names to strip from the curl output. These are
   *  headers curl adds automatically (host, content-length, etc.) that would
   *  appear as noise in the reconstructed command. Pass an empty Set to keep all headers. */
  autoHeaders: DEFAULT_AUTO_HEADERS,

  /** Custom logger function. Defaults to console.log. */
  logger: console.log,

  /** Whether to include the response body in the output. */
  logResponseBody: true,

  /** Whether to mount the live dashboard. */
  dashboard: true,

  /** URL path the dashboard is served at. */
  dashboardPath: '/_curlit',

  /** Max number of requests to keep in the ring buffer. */
  bufferSize: 200
}

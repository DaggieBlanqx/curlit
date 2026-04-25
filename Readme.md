# cUrlit: Turn live traffic into a Postman collection, and watch it build itself

<img src="https://img.shields.io/npm/v/curlit" alt="cUrlit version"/> <img src="https://img.shields.io/npm/dw/curlit" alt="cUrlit weekly downloads"/> <img src="https://img.shields.io/github/stars/DaggieBlanqx/curlit?style=social" alt="GitHub stars"/> <img src="https://img.shields.io/badge/works%20with-any%20backend-FF6C37" alt="Works with any backend"/>
<br/>

> **Stop documenting your API manually.**
> cUrlit intercepts every request hitting your server and turns it into a ready-to-run cURL command — live, in the browser, with one-click Postman export.
> **No config. No account. No API key.**

---

![cUrlit dashboard demo](https://raw.githubusercontent.com/DaggieBlanqx/curlit/main/assets/demo.gif)

---

## The problem

You've just spent three days building an API. Your client wants a Postman collection by Friday. You open Postman and stare at a blank screen — every endpoint needs to be typed in manually. The auth headers. The request bodies. The query params. All of it.

You have better things to do.

## The solution

Install cUrlit. Hit your endpoints once while you test. Click Export.

Your entire Postman collection is ready. In the time it took to read this sentence.

---

## Up and running in 30 seconds

```bash
npm install curlit
```

```js
import curlit from 'curlit'
app.use(curlit())
```

Open **http://localhost:3000/_curlit** — your live dashboard is ready.
Now, as requests hit your endpoint, your postman collection gradually builds itself. Once satisfies, click on the EXPORT button to save it.

That's it. No config, no account, no API key.

---

## Works with any backend

Not using Express? No problem. cUrlit ships a standalone proxy that sits in front of **any server** — PHP, Laravel, Django, Rails, Kotlin, Go, anything.

```bash
# Install once
npm install -g curlit

# Proxy any server — no code changes required
curlit-proxy --target http://localhost:8080
```

```
Your client(mobile app/browser) → http://localhost:3000 (cUrlit in the middle) → http://localhost:8080 (your server)
```

Every request is captured. Your server never knows the difference.

### Works with every stack

```bash
curlit-proxy --target http://localhost:8080   # PHP / Laravel / Kotlin / Spring
curlit-proxy --target http://localhost:8000   # Django / FastAPI
curlit-proxy --target http://localhost:3000 --port 4000  # Rails
curlit-proxy --target http://localhost:9090   # Go
curlit-proxy --target https://staging.myapp.com  # Remote staging
```

---

## Why cUrlit?

|                             | cUrlit | Manual logging | Postman Interceptor |
|-----------------------------|--------|----------------|---------------------|
| Zero config                 | ✅     | ❌             | ❌                  |
| Live browser dashboard      | ✅     | ❌             | ✅                  |
| One-click Postman export    | ✅     | ❌             | ✅                  |
| Works with Express          | ✅     | ✅             | ❌                  |
| Works with ANY backend      | ✅     | ❌             | ❌                  |
| Sensitive header redaction  | ✅     | ❌             | ❌                  |
| Open source                 | ✅     | ✅             | ❌                  |
| One line to install         | ✅     | ❌             | ❌                  |

---

## What you can do with it

- 🔍 **Debug** — inspect every request and response in real time, no console diving
- 📊 Monitor live traffic through a gorgeous browser dashboard
- 📦 **Export** — turn a live session into a full Postman collection in one click
- ▶️ **Replay** — copy any captured request and run it directly from your terminal
- 🌍 **Proxy** — drop in front of any backend, any language, zero code changes
- 🔒 **Redact** — sensitive headers like `Authorization` and `Cookie` are hidden automatically

---

## Live dashboard

cUrlit serves a live SSE dashboard at `/_curlit` the moment your server starts. No setup.

### Features

- **Live feed** — new requests stream in instantly via Server-Sent Events (SSE), no polling, no refresh
- **cURL tab** — full generated command with syntax highlighting and one-click copy
- **Headers tab** — all request headers, sensitive values auto-redacted
- **Response tab** — response body, auto pretty-printed if JSON
- **Export button** — one click downloads a complete Postman Collection v2.1 JSON
- **Filter bar** — search by route, method, or status code
- **Method chips** — instantly narrow to GET, POST, PUT, PATCH, or DELETE
- **Clear button** — wipe history without restarting the server

### Access it

```
http://localhost:3000/_curlit
```

### Enable / disable

```js
// Disable the dashboard
app.use(curlit({ dashboard: false }))

// Custom path
app.use(curlit({ dashboardPath: '/_debug' }))
```

> The dashboard **never mounts in production** unless you explicitly pass `enabledEnvs: null`. It is a development tool.

---

## How it works

```
Incoming request
      ↓
cUrlit middleware
      ↓
Builds cURL command → logs to console → pushes to dashboard via SSE
      ↓
Your route handler runs normally
      ↓
Response captured → ring buffer updated → dashboard updated live
```

---

## Full Express example

```js
import express from 'express'
import curlit from 'curlit'

const app = express()

app.use(express.json())
app.use(curlit())

app.get('/api/users', (req, res) => {
  res.json({ users: [] })
})

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
  console.log('Dashboard at http://localhost:3000/_curlit')
})
```

---

## What the console output looks like

```curl
curl -X POST "http://localhost:9000/api/transactions" \
  -H "x-api-key: <redacted>" \
  -H "content-type: application/json" \
  -d '{"amount": 100.5, "currency": "USD"}'
```

```json
{
  "success": true,
  "records": [
    {
      "id": 123456789,
      "status": "Completed",
      "amount": 100.5,
      "currency": "USD",
      "channel": "Credit Card",
      "paidAt": "2024-02-20T15:30:00Z"
    }
  ],
  "total": 100.5,
  "page": 1,
  "pageSize": 1
}
```

---

## File structure

```
curlit/
├── index.js        — middleware factory, request wiring
├── cli.js          — curlit-proxy CLI entrypoint
├── proxy.js        — http-proxy-middleware wrapper
├── defaults.js     — DEFAULT_OPTIONS, DEFAULT_REDACTED_HEADERS, DEFAULT_AUTO_HEADERS
├── helpers.js      — pure functions: curl building, escaping, body formatting
├── ring-buffer.js  — fixed-size in-memory buffer with pub/sub for SSE
├── dashboard.js    — SSE router, clear endpoint, HTML serving
└── dashboard.html  — dashboard UI (Tailwind + IBM Plex, no build step)
```

---

## Configuration

All options are optional. `curlit()` with no arguments uses sensible defaults.

```js
app.use(curlit({
  enabledEnvs:     ['development', 'test'], // environments where logging is active
  maxBodyLength:   4096,                    // truncate response bodies larger than this (bytes)
  logResponseBody: true,                    // set to false to only log the curl command
  dashboard:       true,                    // serve the live dashboard
  dashboardPath:   '/_curlit',             // URL the dashboard is mounted at
  bufferSize:      200,                     // max requests kept in memory for the dashboard
  redactedHeaders: new Set([               // values replaced with <redacted>
    'authorization', 'cookie', 'set-cookie',
    'x-api-key', 'x-auth-token', 'proxy-authorization',
  ]),
  autoHeaders: new Set([                   // noise headers stripped from curl output
    'host', 'user-agent', 'accept',
    'accept-encoding', 'connection',
    'content-length', 'transfer-encoding',
  ]),
  logger: console.log,                     // swap in pino, winston, etc.
}))
```

---

## Recipes

### Zero config

```js
app.use(curlit())
```

### Dashboard only, silent console

```js
app.use(curlit({ logger: () => {} }))
```

### Force on in all environments

```js
app.use(curlit({ enabledEnvs: null }))
```

> **Warning:** this logs all request bodies and URLs. Only use this for short-lived debugging sessions.

### Custom sensitive headers

```js
import curlit, { DEFAULT_REDACTED_HEADERS } from 'curlit'

app.use(curlit({
  redactedHeaders: new Set([...DEFAULT_REDACTED_HEADERS, 'x-tenant-id'])
}))
```

### Custom auto-stripped headers

```js
import curlit, { DEFAULT_AUTO_HEADERS } from 'curlit'

app.use(curlit({
  autoHeaders: new Set([...DEFAULT_AUTO_HEADERS, 'x-forwarded-for'])
}))
```

### Route-scoped

```js
const curlLogger = curlit({ logResponseBody: false })
app.post('/webhooks', curlLogger, (req, res) => res.sendStatus(200))
```

### Custom logger (Pino)

```js
import pino from 'pino'
const logger = pino()
app.use(curlit({ logger: (msg) => logger.debug({ msg }, 'curlit') }))
```

### Proxy CLI options

```bash
curlit-proxy --target http://localhost:8080   # required: target server
             --port 3000                      # proxy port (default: 3000)
             --dashboard-path /_curlit        # dashboard path (default: /_curlit)
             --no-dashboard                   # disable dashboard
             --env development                # override NODE_ENV
```

---

## Built something with cUrlit?

Tag [@daggieblanqx](https://twitter.com/daggieblanqx) on Twitter — I'll retweet it.

⭐ If cUrlit saves you time, [star the repo](https://github.com/DaggieBlanqx/curlit) — it helps other developers find it.

---

## License

MIT © [Daggie Blanqx](https://github.com/DaggieBlanqx)

---

### Help & community

- Questions → [GitHub Discussions](https://github.com/DaggieBlanqx/curlit/discussions)
- Bugs → [open an issue](https://github.com/DaggieBlanqx/curlit/issues)
- Features → [create a pull request](https://github.com/DaggieBlanqx/curlit/pulls)

### Reach out

- Twitter: [@daggieblanqx](https://twitter.com/daggieblanqx)
- LinkedIn: [@daggieblanqx](https://www.linkedin.com/in/daggieblanqx/)
- Blog: [Logrocket/@Daggieblanqx](https://blog.logrocket.com/author/daggieblanqx/)
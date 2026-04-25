# cUrlit - turning complexity into simplicity


<img src="https://img.shields.io/npm/v/curlit" alt="cUrlit"/>
<img src="https://img.shields.io/npm/dw/curlit" alt="cUrlit"/>
<br/>

**curlit** is an Express middleware that logs a multi‑line cURL command representing the incoming request and its response — and ships with a live browser dashboard to inspect, filter, and copy those commands in real time.

## Imagine this, story time:
After months of hard work, you've built a robust API server that your customers are now using daily. One day, you realize that you need to create a Postman collection for your API—something that used to take hours of manual effort.

Now, instead of diving back into the tedious task of documenting every endpoint, you integrate the curlit middleware into your server's entry point.

Suddenly, each time a request is processed, curlit generates a ready-to-use cURL command. With a quick copy and paste, you start building your Postman collection effortlessly. What once seemed like a stressful, time-consuming chore is now a streamlined process, giving you more time to focus on enhancing your application rather than documenting it.

This is the magic of curlit—turning complexity into simplicity, one cURL command at a time.

---

## Use cases
- Debugging, testing, or reproducing API calls easily.
- Copy the curl command and run it directly in your terminal.
- Paste into [Postman](https://learning.postman.com/docs/getting-started/importing-and-exporting/importing-curl-commands/) to build a Postman collection.
- Use the live dashboard to inspect all requests hitting your server without leaving the browser.

---

## Installation

```bash
npm install curlit
```

or

```bash
pnpm add curlit
```

---

## Usage

```js
const express = require('express'); // or import express from 'express'
const curlit = require('curlit');   // or import curlit from 'curlit'

const app = express();

app.use(express.json());
app.use(curlit());

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

---

## Live dashboard

curlit ships with a built-in browser dashboard served at `/_curlit`. It shows every request hitting your server in real time — no separate setup needed.

### Features
- **Live feed** — new requests appear instantly via Server-Sent Events (SSE), no polling.
- **cURL tab** — the full generated curl command with syntax highlighting and a one-click copy button.
- **Headers tab** — all request headers, with sensitive values already redacted.
- **Response tab** — the response body, pretty-printed if JSON.
- **Filter bar** — search by route, method, or status code.
- **Method chips** — quickly narrow to GET, POST, PUT, PATCH, or DELETE.
- **Clear button** — wipe the request history without restarting the server.

### Accessing it

Start your server and open:

```
http://localhost:3000/_curlit
```

### Enabling / disabling

The dashboard is **on by default** in `development` and `test`. To turn it off:

```js
app.use(curlit({ dashboard: false }))
```

To serve it at a custom path:

```js
app.use(curlit({ dashboardPath: '/_debug' }))
// dashboard now at http://localhost:3000/_debug
```

> **Note:** The dashboard never mounts in `production` unless you explicitly set `enabledEnvs: null`. It is a development tool.

---

## How the console log looks

### Request example

```curl
curl -X GET \
  -H "accept: application/json" \
  -H "content-type: application/json" \
  -H "authorization: <redacted>" \
  -H "x-client-id: com.example.app" \
  -H "host: localhost:9000" \
  -H "accept-encoding: gzip, deflate, br" \
  -H "connection: keep-alive" \
  "http://localhost:9000/api/transactions?page=1&pageSize=10"
```

### Response example

```json
{
    "success": true,
    "records": [
        {
            "id": 123456789,
            "status": "Completed",
            "reference": "INV-98765",
            "amount": 100.5,
            "currency": "USD",
            "channel": "Credit Card",
            "paidAt": "2024-02-20T15:30:00Z",
            "customerId": "67b49ecb34975e212b9afbc0",
            "yearMonth": 202402
        },
        {
            "id": 123456790,
            "status": "Pending",
            "reference": "INV-98766",
            "amount": 50,
            "currency": "USD",
            "channel": "Mpesa",
            "paidAt": "2024-02-21T10:00:00Z",
            "customerId": "67b49ecb34975e212b9afbc0",
            "yearMonth": 202402
        }
    ],
    "total": 150.5,
    "page": 1,
    "pageSize": 2,
    "remaining": 5
}
```

---

## How it works

- **Request interception** — the middleware captures every incoming request before your route handler runs.
- **cURL builder** — constructs a valid, runnable curl command from the method, headers, body, and full URL.
- **Console logging** — prints the curl command and response body to stdout (or your custom logger).
- **Dashboard push** — stores the request in an in-memory ring buffer and streams it to any open dashboard tabs via SSE.
- **Continuation** — calls the original `res.send` to complete the response normally.

---

## File structure

curlit is split into focused modules so each piece is independently readable and testable:

```
curlit/
├── index.js        — factory function, middleware wiring
├── defaults.js     — DEFAULT_OPTIONS and DEFAULT_REDACTED_HEADERS constants
├── helpers.js      — pure functions: curl building, escaping, body formatting
├── ring-buffer.js  — fixed-size in-memory buffer with pub/sub for SSE
├── dashboard.js    — SSE router, clear endpoint, HTML serving
└── dashboard.html  — dashboard UI (Tailwind + IBM Plex, no build step)
```

---

## Configuration

`curlit` is a factory function — call it with an options object to customise its behaviour.

```js
app.use(curlit({
  enabledEnvs:     ['development', 'test'], // environments where logging is active
  maxBodyLength:   4096,                    // truncate response bodies larger than this (bytes)
  logResponseBody: true,                    // set to false to only log the curl command
  dashboard:       true,                    // serve the live dashboard at dashboardPath
  dashboardPath:   '/_curlit',             // URL the dashboard is mounted at
  bufferSize:      200,                     // max requests kept in memory for the dashboard
  redactedHeaders: new Set([               // headers whose values are replaced with <redacted>
    'authorization',
    'cookie',
    'set-cookie',
    'x-api-key',
    'x-auth-token',
    'proxy-authorization',
  ]),
  logger: console.log,                     // swap in any logger (pino, winston, etc.)
}))
```

All options are optional — calling `curlit()` with no arguments uses the defaults above.

---

## Usage examples

### Zero config (development only)

```js
app.use(curlit())
```

Active in `development` and `test`. Silently skipped in `production`.

---

### Force-enable in all environments

```js
app.use(curlit({ enabledEnvs: null }))
```

> **Warning:** this logs all request bodies and URLs. Only use this for short-lived debugging sessions.

---

### Dashboard only, no console logs

```js
app.use(curlit({ logger: () => {} }))
```

---

### Suppress response body logging

```js
app.use(curlit({ logResponseBody: false }))
```

---

### Custom redacted headers

```js
import curlit, { DEFAULT_REDACTED_HEADERS } from 'curlit'

app.use(curlit({
  redactedHeaders: new Set([
    ...DEFAULT_REDACTED_HEADERS,
    'x-tenant-id',
    'x-internal-token',
  ])
}))
```

---

### Custom logger (e.g. Pino)

```js
import pino from 'pino'

const logger = pino()

app.use(curlit({
  logger: (msg) => logger.debug({ msg }, 'curlit')
}))
```

---

### Route-scoped usage

```js
const curlLogger = curlit({ logResponseBody: false })

app.post('/webhooks', curlLogger, (req, res) => {
  res.sendStatus(200)
})
```

---

### Increase the body truncation limit

```js
app.use(curlit({ maxBodyLength: 20_000 }))
```

---

## License
MIT

---

### Help information

- If you have any questions, ask via the [GitHub Discussion forums](https://github.com/DaggieBlanqx/curlit/discussions)
- If you have any suggestions or feedback, please [open an issue](https://github.com/DaggieBlanqx/curlit/issues) or [create a pull request](https://github.com/DaggieBlanqx/curlit/pulls).

### Notes

- This package is in active development.
- New features are added regularly.
- If your favourite feature is missing, you can always bump a version backwards or [create a pull request](https://github.com/DaggieBlanqx/curlit/pulls) which will be reviewed and merged into [the next release](https://github.com/DaggieBlanqx/curlit/releases).
- Thanks for your contribution.
- Happy coding!

### Reach out

- Follow me on Twitter: [@daggieblanqx](https://twitter.com/daggieblanqx)
- I am also on LinkedIn, where you can tag me to the awesome projects you've built using this package: [@daggieblanqx](https://www.linkedin.com/in/daggieblanqx/)
- Blog posts: [Logrocket/@Daggieblanqx](https://blog.logrocket.com/author/daggieblanqx/)
#!/usr/bin/env node

import express from 'express'
import curlit from './index.js'
import { createProxy } from './proxy.js'

// ── Argument parsing ─────────────────────────────────────────────────────────

const args = process.argv.slice(2)

function getArg (flag, defaultValue = null) {
  const i = args.indexOf(flag)
  if (i !== -1 && args[i + 1]) return args[i + 1]
  return defaultValue
}

function hasFlag (flag) {
  return args.includes(flag)
}

const target = getArg('--target')
const port = parseInt(getArg('--port', '3000'), 10)
const dashboardPath = getArg('--dashboard-path', '/_curlit')
const noDashboard = hasFlag('--no-dashboard')
const env = getArg('--env', process.env.NODE_ENV || 'development')

// ── Validation ────────────────────────────────────────────────────────────────

if (!target) {
  console.error('\n  [curlit-proxy] Missing required flag: --target\n')
  console.error('  Usage:')
  console.error('    curlit-proxy --target http://localhost:8080\n')
  console.error('  Options:')
  console.error('    --target          Target server URL (required)')
  console.error('    --port            Port to run proxy on (default: 3000)')
  console.error('    --dashboard-path  Dashboard URL path (default: /_curlit)')
  console.error('    --no-dashboard    Disable the dashboard')
  console.error('    --env             Override NODE_ENV (default: development)\n')
  process.exit(1)
}

try {
  new URL(target) // eslint-disable-line no-new
} catch {
  console.error(`\n  [curlit-proxy] Invalid target URL: "${target}"`)
  console.error('  Example: --target http://localhost:8080\n')
  process.exit(1)
}

// ── App setup ─────────────────────────────────────────────────────────────────

process.env.NODE_ENV = env

const app = express()

// Parse JSON and urlencoded bodies so curlit can read req.body
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Mount curlit middleware
app.use(curlit({
  dashboard: !noDashboard,
  dashboardPath,
  enabledEnvs: null // always on in proxy mode — user opted in explicitly
}))

// Forward everything else to the target
app.use('/', createProxy(target))

// ── Start ─────────────────────────────────────────────────────────────────────

const server = app.listen(port, () => {
  const dashboardUrl = `http://localhost:${port}${dashboardPath}`
  const proxyUrl = `http://localhost:${port}`

  console.log('\n  ┌─────────────────────────────────────────────┐')
  console.log('  │           cUrlit proxy is running           │')
  console.log('  └─────────────────────────────────────────────┘\n')
  console.log(`  Proxying  →  ${target}`)
  console.log(`  Proxy URL →  ${proxyUrl}`)
  if (!noDashboard) {
    console.log(`  Dashboard →  ${dashboardUrl}`)
  }
  console.log('\n  All traffic is being logged.')
  console.log('  Press Ctrl+C to stop.\n')
})

// Forward WebSocket upgrades
server.on('upgrade', createProxy(target).upgrade)

// ── Graceful shutdown ─────────────────────────────────────────────────────────

process.on('SIGINT', () => {
  console.log('\n\n  [curlit-proxy] Shutting down...\n')
  server.close(() => process.exit(0))
})

process.on('SIGTERM', () => {
  server.close(() => process.exit(0))
})

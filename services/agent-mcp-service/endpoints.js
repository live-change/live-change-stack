import definition from './definition.js'
import config from './config.js'
import { authenticateRequest } from './authenticator.js'
import { handleMcpRequest, resetToolsCache } from './tools.js'

function endpointBaseUrl(req) {
  const protoHeader = req.headers['x-forwarded-proto']
  const hostHeader = req.headers['x-forwarded-host'] || req.headers.host
  const proto = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader
  if (proto && host) return proto + '://' + host
  if (host) return 'http://' + host
  return undefined
}

function writeJson(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function allowCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

function ssePathFor(endpoint) {
  if (endpoint.ssePath) return endpoint.ssePath
  if (endpoint.path?.endsWith('/rpc')) return endpoint.path.slice(0, -4) + '/sse'
  return endpoint.path + '/sse'
}

async function dispatch(req, res, endpoint, rawBody) {
  const auth = await authenticateRequest(req, endpoint)
  if (auth.error) {
    allowCors(res)
    writeJson(res, auth.status || 401, {
      jsonrpc: '2.0',
      id: null,
      error: { code: -32001, message: auth.error }
    })
    return
  }
  let parsed
  try {
    parsed = JSON.parse(rawBody || '{}')
  } catch {
    allowCors(res)
    writeJson(res, 200, {
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: 'Parse error' }
    })
    return
  }
  const response = await handleMcpRequest(parsed, {
    endpoint,
    auth: auth.auth,
    baseUrl: endpointBaseUrl(req)
  })
  allowCors(res)
  writeJson(res, 200, response)
}

function registerHttp(endpoint) {
  definition.endpoint({
    name: endpoint.name + 'Http',
    path: endpoint.path,
    async create() {
      return async function agentMcpHttpHandler(req, res) {
        if (req.method === 'OPTIONS') {
          allowCors(res)
          res.statusCode = 204
          res.end()
          return
        }
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end()
          return
        }
        const rawBody = await readBody(req)
        await dispatch(req, res, endpoint, rawBody)
      }
    }
  })
}

function registerSse(endpoint) {
  definition.endpoint({
    name: endpoint.name + 'Sse',
    path: ssePathFor(endpoint),
    async create() {
      return async function agentMcpSseHandler(req, res) {
        res.setHeader('Content-Type', 'text/event-stream')
        res.setHeader('Cache-Control', 'no-cache')
        res.setHeader('Connection', 'keep-alive')
        allowCors(res)
        res.flushHeaders?.()
        req.on('close', () => res.end())
        if (req.method !== 'POST') return
        const rawBody = await readBody(req)
        const auth = await authenticateRequest(req, endpoint)
        if (auth.error) {
          res.write('data: ' + JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: { code: -32001, message: auth.error }
          }) + '\n\n')
          res.end()
          return
        }
        try {
          const response = await handleMcpRequest(JSON.parse(rawBody || '{}'), {
            endpoint,
            auth: auth.auth,
            baseUrl: endpointBaseUrl(req)
          })
          res.write('data: ' + JSON.stringify(response) + '\n\n')
        } catch {
          res.write('data: ' + JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: { code: -32700, message: 'Parse error' }
          }) + '\n\n')
        }
        res.end()
      }
    }
  })
}

let stdioAttached = false

function attachStdio(endpoint) {
  if (stdioAttached) return
  if (process.env.AGENT_MCP_TRANSPORT !== 'stdio') return
  stdioAttached = true
  console.log = (...args) => process.stderr.write('[agent-mcp] ' + args.join(' ') + '\n')
  console.error = (...args) => process.stderr.write('[agent-mcp-err] ' + args.join(' ') + '\n')
  let buffer = ''
  process.stdin.setEncoding('utf8')
  process.stdin.on('data', async chunk => {
    buffer += chunk
    const lines = buffer.split('\n')
    buffer = lines.pop()
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      try {
        const response = await handleMcpRequest(JSON.parse(trimmed), { endpoint })
        process.stdout.write(JSON.stringify(response) + '\n')
      } catch {
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: { code: -32700, message: 'Parse error' }
        }) + '\n')
      }
    }
  })
  process.stdin.resume()
  process.stderr.write('[agent-mcp] stdio server started\n')
}

for (const endpoint of config.endpoints) {
  const transport = endpoint.transport || ['http']
  if (!endpoint.path) throw new Error('MCP endpoint ' + endpoint.name + ' needs a path')
  if (transport.includes('http')) registerHttp(endpoint)
  if (transport.includes('sse')) registerSse(endpoint)
  if (transport.includes('stdio')) attachStdio(endpoint)
}

definition.afterStart(async () => {
  resetToolsCache()
})

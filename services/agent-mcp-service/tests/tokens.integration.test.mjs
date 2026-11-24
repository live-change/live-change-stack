import assert from 'node:assert/strict'
import http from 'node:http'
import { test } from 'node:test'
import App from '@live-change/framework'

const app = App.app()
app.config = {
  services: [
    { name: 'session', createSessionOnUpdate: false },
    { name: 'user' },
    { name: 'accessControl', contactTypes: [] },
    {
      name: 'agentMcpServer',
      endpoints: [{
        name: 'agent',
        path: '/api/agentMcpServer/rpc',
        transport: ['http'],
        requireToken: true,
        serverName: 'test-mcp',
        snippetName: 'test-mcp',
        expose: { includeServices: [] }
      }]
    }
  ]
}

const session = (await import('@live-change/session-service')).default
const user = (await import('@live-change/user-service')).default
const accessControl = (await import('@live-change/access-control-service')).default
const agentMcpServer = (await import('../index.js')).default
const { hashToken } = await import('../httpAuth.js')

for (const serviceConfig of app.config.services) {
  serviceConfig.module = { session, user, accessControl, agentMcpServer }[serviceConfig.name]
}

const { TestServer } = await import('@live-change/server')

let server

test.before(async () => {
  server = new TestServer({
    dev: true,
    withSsr: false,
    enableSessions: true,
    port: 0,
    services: app.config
  })
  await server.start()
})

test.after(async () => {
  if (server) await server.dispose()
})

function rpc(url, method, params, token) {
  const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
  const target = new URL(url)
  const headers = {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(body)
  }
  if (token) headers.authorization = 'Bearer ' + token
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: target.hostname,
      port: target.port,
      path: target.pathname + target.search,
      method: 'POST',
      headers
    }, res => {
      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: JSON.parse(Buffer.concat(chunks).toString() || 'null')
        })
      })
    })
    req.on('error', reject)
    req.end(body)
  })
}

test('create stores a hash, signs in a session, and rejects a revoked token', async () => {
  const services = await server.services
  const userId = app.generateUid()
  await services.user.models.User.create({ id: userId, roles: ['member'] })
  const created = await services.agentMcpServer.actions.createMyUserMcpToken.callCommand({
    name: 'laptop'
  }, { user: userId, roles: ['member'], session: 'browser' })
  assert.ok(created.token.startsWith('mcp_'))
  const row = await services.agentMcpServer.models.McpToken.indexObjectGet('byTokenHash', [hashToken(created.token)])
  assert.equal(row.user, userId)
  assert.equal(row.tokenHash, hashToken(created.token))
  assert.ok(row.session)
  const authenticated = await services.user.models.AuthenticatedUser.get(row.session)
  assert.equal(authenticated.user, userId)
  const sessionRow = await services.session.models.Session.get(row.session)
  assert.ok(sessionRow)

  const listed = await rpc(server.url + '/api/agentMcpServer/rpc', 'tools/list', {}, created.token)
  assert.equal(listed.status, 200)
  assert.ok(Array.isArray(listed.body.result.tools))

  const missing = await rpc(server.url + '/api/agentMcpServer/rpc', 'tools/list')
  assert.equal(missing.status, 401)

  const query = await rpc(server.url + '/api/agentMcpServer/rpc?token=' + encodeURIComponent(created.token), 'initialize', {})
  assert.equal(query.status, 200)
  assert.equal(query.body.result.serverInfo.name, 'test-mcp')

  await services.agentMcpServer.actions.revokeMyUserMcpToken.callCommand({
    mcpToken: created.id
  }, { user: userId, roles: ['member'], session: 'browser' })
  const revoked = await services.agentMcpServer.models.McpToken.get(created.id)
  assert.ok(revoked.revokedAt)
  const denied = await rpc(server.url + '/api/agentMcpServer/rpc', 'tools/list', {}, created.token)
  assert.equal(denied.status, 401)
  assert.match(denied.body.error.message, /revoked/)
})

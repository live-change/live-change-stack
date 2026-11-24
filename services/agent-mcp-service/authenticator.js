import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import {
  extractToken,
  hashToken,
  rejectionReason,
  shouldTouchToken
} from './httpAuth.js'

const User = definition.foreignModel('user', 'User')

export { extractToken, hashToken, rejectionReason, shouldTouchToken }

export async function resolveToken(token) {
  if (!token) return { error: 'token required', status: 401 }
  const McpToken = app.startedServices?.agentMcpServer?.models?.McpToken
  if (!McpToken) return { error: 'token service is not ready', status: 503 }
  const row = await McpToken.indexObjectGet('byTokenHash', [hashToken(token)])
  const reason = rejectionReason(row)
  if (reason) return { error: reason, status: 401 }
  const userRow = await User.get(row.user)
  if (!userRow) return { error: 'invalid token', status: 401 }
  if (shouldTouchToken(row.lastUsedAt)) {
    try {
      await app.triggerService({
        service: 'agentMcpServer',
        type: 'touchMcpToken'
      }, { mcpToken: row.id })
    } catch (error) {
      console.error('mcp token touch failed', error)
    }
  }
  return {
    auth: {
      user: row.user,
      session: row.session,
      roles: Array.isArray(userRow.roles) ? userRow.roles : [],
      tokenId: row.id
    }
  }
}

export async function authenticateRequest(req, endpoint) {
  if (!endpoint?.requireToken) return { auth: null }
  return resolveToken(extractToken(req))
}

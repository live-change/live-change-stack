import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  extractToken,
  hashToken,
  rejectionReason,
  shouldTouchToken,
  TOKEN_TOUCH_MS
} from '../httpAuth.js'

test('extractToken reads Bearer before the query string', () => {
  assert.equal(extractToken({
    headers: { authorization: 'Bearer mcp_abc' },
    url: '/api/agentMcpServer/rpc?token=other'
  }), 'mcp_abc')
  assert.equal(extractToken({
    headers: {},
    url: '/api/agentMcpServer/rpc?token=mcp_query'
  }), 'mcp_query')
  assert.equal(extractToken({ headers: { authorization: 'Basic x' }, url: '/rpc' }), null)
})

test('hashToken is stable sha256 hex', () => {
  assert.equal(hashToken('mcp_abc'), hashToken('mcp_abc'))
  assert.notEqual(hashToken('mcp_abc'), hashToken('mcp_abd'))
  assert.equal(hashToken('mcp_abc').length, 64)
})

test('rejectionReason distinguishes missing and revoked tokens', () => {
  assert.equal(rejectionReason(null), 'invalid token')
  assert.equal(rejectionReason({ revokedAt: new Date() }), 'revoked token')
  assert.equal(rejectionReason({ id: 't1' }), null)
})

test('shouldTouchToken waits an hour between writes', () => {
  const now = new Date('2026-11-15T12:00:00Z')
  assert.equal(shouldTouchToken(null, now), true)
  assert.equal(shouldTouchToken(new Date(now.getTime() - 1000), now), false)
  assert.equal(shouldTouchToken(new Date(now.getTime() - TOKEN_TOUCH_MS), now), true)
})

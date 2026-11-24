import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildSnippets } from '../snippets.js'

test('snippets include bearer headers and a token url', () => {
  const snippets = buildSnippets({
    origin: 'http://localhost:8001',
    path: '/api/agentMcpServer/rpc',
    token: 'mcp_secret',
    snippetName: 'html5-ads'
  })
  const cursor = snippets.find(item => item.id === 'cursor').snippet
  assert.match(cursor, /Bearer mcp_secret/)
  assert.match(cursor, /http:\/\/localhost:8001\/api\/agentMcpServer\/rpc/)
  const url = snippets.find(item => item.id === 'url').snippet
  assert.equal(url, 'http://localhost:8001/api/agentMcpServer/rpc?token=mcp_secret')
  const codex = snippets.find(item => item.id === 'codex').snippet
  assert.match(codex, /mcp_servers\."html5-ads"/)
})

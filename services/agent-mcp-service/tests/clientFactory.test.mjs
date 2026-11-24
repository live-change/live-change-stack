import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  openClient,
  prepareOpenCall,
  prepareTokenCall,
  tokenClient,
  withMcpUserParam
} from '../clientFactory.js'

const openEndpoint = {
  name: 'open',
  roles: ['admin'],
  userScopedServices: ['seo']
}

test('openClient uses the endpoint session and roles', () => {
  assert.deepEqual(openClient({ session: 'agent-mcp', roles: ['admin'] }), {
    session: 'agent-mcp',
    roles: ['admin']
  })
  assert.deepEqual(openClient({}), {
    session: 'agent-mcp',
    roles: ['admin']
  })
})

test('tokenClient copies the session user and real roles', () => {
  assert.deepEqual(tokenClient({
    session: 's1',
    user: 'u1',
    roles: ['member']
  }), {
    session: 's1',
    user: 'u1',
    roles: ['member']
  })
})

test('withMcpUserParam adds user only for open user-scoped services', () => {
  const schema = { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] }
  const tokenSchema = withMcpUserParam(schema, 'html5Ads', { requireToken: true, userScopedServices: ['html5Ads'] })
  assert.equal(tokenSchema.properties.user, undefined)
  const openSchema = withMcpUserParam(schema, 'seo', openEndpoint)
  assert.equal(openSchema.properties.user.type, 'string')
  assert.ok(openSchema.required.includes('user'))
  assert.ok(openSchema.required.includes('name'))
  const plain = withMcpUserParam(schema, 'invoice', openEndpoint)
  assert.equal(plain.properties.user, undefined)
})

test('prepareOpenCall strips user for scoped services and keeps admin client otherwise', () => {
  const scoped = prepareOpenCall(openEndpoint, 'seo', { user: 'u1', phrase: 'p' })
  assert.equal(scoped.user, 'u1')
  assert.equal(scoped.payload.user, undefined)
  assert.equal(scoped.payload.phrase, 'p')
  assert.equal(scoped.client.user, 'u1')
  assert.deepEqual(scoped.client.roles, ['admin'])
  assert.equal(scoped.enforceAccess, true)
  assert.throws(() => prepareOpenCall(openEndpoint, 'seo', {}), /user/)
  const open = prepareOpenCall(openEndpoint, 'invoice', { company: 'c1' })
  assert.equal(open.user, null)
  assert.equal(open.client.user, undefined)
  assert.equal(open.enforceAccess, false)
  assert.equal(open.payload.company, 'c1')
})

test('prepareTokenCall rejects a mismatched user and strips a matching one', () => {
  const auth = { session: 's1', user: 'u1', roles: ['member'] }
  const ok = prepareTokenCall({ name: 'Post', user: 'u1' }, auth)
  assert.equal(ok.payload.user, undefined)
  assert.equal(ok.payload.name, 'Post')
  assert.equal(ok.client.user, 'u1')
  assert.deepEqual(ok.client.roles, ['member'])
  assert.equal(ok.enforceAccess, true)
  const bare = prepareTokenCall({ name: 'Post' }, auth)
  assert.equal(bare.client.session, 's1')
  assert.throws(() => prepareTokenCall({ user: 'other' }, auth), /does not match/)
  assert.throws(() => prepareTokenCall({}, null), /token is required/)
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hashCompositeId, HASH_ID_PREFIX } from '../src/hashId.js'
import {
  generateId,
  generateAnyId,
  buildCompositeId,
  buildAnyCompositeId,
  applyHashId
} from '../src/idGeneration.js'

test('hashCompositeId is deterministic', () => {
  const input = '"a":"b":"c":"d"'
  assert.equal(hashCompositeId(input), hashCompositeId(input))
})

test('hashCompositeId produces exactly 22 base64url characters', () => {
  const hash = hashCompositeId('some long composite id string')
  assert.equal(hash.length, 22)
  assert.match(hash, /^[A-Za-z0-9_-]+$/)
})

test('generateId without hashId is unchanged', () => {
  const props = { owner: 'u1', item: 'i1' }
  assert.equal(
    generateId(['owner', 'item'], props),
    '"u1":"i1"'
  )
  assert.equal(
    generateId(['owner'], { owner: 'u1' }),
    'u1'
  )
})

test('generateId with hashId true returns h_ prefix and short id', () => {
  const props = { owner: 'u1', item: 'i1' }
  const id = generateId(['owner', 'item'], props, { hashId: true })
  assert.ok(id.startsWith(HASH_ID_PREFIX))
  assert.equal(id.length, HASH_ID_PREFIX.length + 22)
  assert.equal(id, generateId(['owner', 'item'], props, { hashId: true }))
})

test('generateAnyId with hashId true returns h_ prefix and short id', () => {
  const props = {
    outputType: 'seo_Evaluation',
    output: 'eval-123'
  }
  const id = generateAnyId(['output'], props, { hashId: true })
  assert.ok(id.startsWith(HASH_ID_PREFIX))
  assert.equal(id.length, HASH_ID_PREFIX.length + 22)
})

test('generateAnyId hybrid keeps type prefix for single parent', () => {
  const props = {
    outputType: 'seo_Evaluation',
    output: 'eval-123'
  }
  const composite = buildAnyCompositeId(['output'], props)
  const id = generateAnyId(['output'], props, { hashId: 'hybrid' })
  assert.ok(id.startsWith('"seo_Evaluation":'))
  assert.equal(id, '"seo_Evaluation":' + hashCompositeId(composite))
  assert.notEqual(id, composite)
})

test('generateAnyId hybrid with two parents behaves like full hash', () => {
  const props = {
    derivationType: 'derivation_Derivation',
    derivation: 'd1',
    sourceType: 'google_Search',
    source: 's1'
  }
  const composite = buildAnyCompositeId(['derivation', 'source'], props)
  const id = generateAnyId(['derivation', 'source'], props, { hashId: 'hybrid' })
  assert.equal(id, HASH_ID_PREFIX + hashCompositeId(composite))
})

test('applyHashId without config returns composite unchanged', () => {
  assert.equal(applyHashId('abc', undefined), 'abc')
  assert.equal(applyHashId('abc', {}), 'abc')
})

test('buildCompositeId matches legacy generateId input for hashing', () => {
  const props = { a: '1', b: '2' }
  assert.equal(buildCompositeId(['a', 'b'], props), '"1":"2"')
})

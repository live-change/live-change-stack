import test from 'node:test'
import assert from 'node:assert/strict'
import ModelDefinition from '../lib/definition/ModelDefinition.ts'
import { structuralPropertyFingerprint } from '../lib/definition/PropertyDefinition.ts'

function model(properties) {
  return new ModelDefinition({ name: 'DeviceCommand', properties }, 'deviceManager')
}

function propertyOps(changes) {
  return changes.filter(c =>
    c.operation === 'createProperty' ||
    c.operation === 'deleteProperty' ||
    c.operation === 'renameProperty'
  )
}

test('structuralPropertyFingerprint ignores meta fields', () => {
  const fp = structuralPropertyFingerprint({
    type: 'String',
    description: 'docs',
    enum: ['a', 'b'],
    enumDescriptions: ['A', 'B'],
    validation: ['nonEmpty'],
    options: ['a', 'b'],
    input: 'select',
    search: { analyzer: 'x' },
    index: { property: 'x' },
    default: []
  })
  assert.deepEqual(fp, { type: 'String', default: [] })
})

test('structuralPropertyFingerprint normalizes defaultValue to default', () => {
  assert.deepEqual(
    structuralPropertyFingerprint({ type: 'Array', defaultValue: [] }),
    structuralPropertyFingerprint({ type: 'Array', default: [] })
  )
})

test('meta-only property change emits no property ops', () => {
  const oldJson = model({
    commands: {
      type: Array,
      description: 'old docs',
      default: [],
      of: { type: Object, description: 'step', properties: { type: { type: String } } }
    }
  }).toJSON()

  const next = model({
    commands: {
      type: Array,
      description: 'new docs about HID',
      enum: undefined,
      validation: ['nonEmpty'],
      default: [],
      of: {
        type: Object,
        description: 'updated step docs',
        properties: {
          type: { type: String, description: 'command type', enum: ['click'] }
        }
      }
    }
  })

  assert.deepEqual(propertyOps(next.computeChanges(oldJson)), [])
})

test('type change emits deleteProperty + createProperty', () => {
  const oldJson = model({
    count: { type: Number, default: 0 }
  }).toJSON()

  const next = model({
    count: { type: String, default: 0 }
  })

  const ops = propertyOps(next.computeChanges(oldJson)).map(c => c.operation)
  assert.deepEqual(ops, ['deleteProperty', 'createProperty'])
})

test('nested properties key change emits deleteProperty + createProperty', () => {
  const oldJson = model({
    payload: {
      type: Object,
      properties: { a: { type: String } }
    }
  }).toJSON()

  const next = model({
    payload: {
      type: Object,
      properties: {
        a: { type: String },
        b: { type: Number }
      }
    }
  })

  const ops = propertyOps(next.computeChanges(oldJson)).map(c => c.operation)
  assert.deepEqual(ops, ['deleteProperty', 'createProperty'])
})

test('default change emits deleteProperty + createProperty', () => {
  const oldJson = model({
    commands: { type: Array, default: [] }
  }).toJSON()

  const next = model({
    commands: { type: Array, default: null }
  })

  const ops = propertyOps(next.computeChanges(oldJson)).map(c => c.operation)
  assert.deepEqual(ops, ['deleteProperty', 'createProperty'])
})

test('default <-> defaultValue alias alone emits no property ops', () => {
  const oldJson = {
    name: 'DeviceCommand',
    properties: {
      commands: { type: 'Array', default: [] }
    }
  }

  const next = model({
    commands: { type: Array, defaultValue: [] }
  })

  assert.deepEqual(propertyOps(next.computeChanges(oldJson)), [])
})

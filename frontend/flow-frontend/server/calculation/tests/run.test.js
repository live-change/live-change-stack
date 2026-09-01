import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runCalculationGraph } from '../runGraph.js'

test('constant returns its value', () => {
  const result = runCalculationGraph({
    constants: [{ id: 'c', value: 4 }]
  })
  assert.equal(result.error, undefined)
  assert.equal(result.values.c, 4)
})

test('add sums inbound values', () => {
  const result = runCalculationGraph({
    constants: [{ id: 'a', value: 2 }, { id: 'b', value: 5 }],
    adds: [{ id: 'sum' }],
    wires: [
      { source: 'a', destination: 'sum', sourcePort: 'out', destinationPort: 'in' },
      { source: 'b', destination: 'sum', sourcePort: 'out', destinationPort: 'in' }
    ]
  })
  assert.equal(result.values.sum, 7)
})

test('empty add is 0 and empty multiply is 1', () => {
  const result = runCalculationGraph({
    adds: [{ id: 'sum' }],
    multiplies: [{ id: 'prod' }]
  })
  assert.equal(result.values.sum, 0)
  assert.equal(result.values.prod, 1)
})

test('multiply products inbound values', () => {
  const result = runCalculationGraph({
    constants: [{ id: 'a', value: 3 }, { id: 'b', value: 4 }],
    multiplies: [{ id: 'prod' }],
    wires: [
      { source: 'a', destination: 'prod', sourcePort: 'out', destinationPort: 'in' },
      { source: 'b', destination: 'prod', sourcePort: 'out', destinationPort: 'in' }
    ]
  })
  assert.equal(result.values.prod, 12)
})

test('power raises the inbound base to exponent', () => {
  const result = runCalculationGraph({
    constants: [{ id: 'base', value: 3 }],
    powers: [{ id: 'pow', exponent: 2 }],
    wires: [
      { source: 'base', destination: 'pow', sourcePort: 'out', destinationPort: 'in' }
    ]
  })
  assert.equal(result.values.pow, 9)
})

test('cycle returns an error', () => {
  const result = runCalculationGraph({
    adds: [{ id: 'a' }, { id: 'b' }],
    wires: [
      { source: 'a', destination: 'b', sourcePort: 'out', destinationPort: 'in' },
      { source: 'b', destination: 'a', sourcePort: 'out', destinationPort: 'in' }
    ]
  })
  assert.ok(result.error)
})

test('power without input returns an error', () => {
  const result = runCalculationGraph({
    powers: [{ id: 'pow', exponent: 2 }]
  })
  assert.ok(result.error)
})

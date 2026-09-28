import { test } from 'node:test'
import assert from 'node:assert/strict'
import createFromTitle from '../createFromTitle.js'

test('latinizes Polish letters and kebab-cases', () => {
  assert.equal(createFromTitle('Łukasz Żółć'), 'lukasz-zolc')
})

test('lowercases ascii names', () => {
  assert.equal(createFromTitle('Jan Kowalski'), 'jan-kowalski')
})

test('replaces @ with -at-', () => {
  assert.equal(createFromTitle('Ada@Studio'), 'ada-at-studio')
})

test('collapses separators and strips leftover punctuation', () => {
  assert.equal(createFromTitle('  Ada__Profile -- One  '), 'ada-profile-one')
})

test('empty or punctuation-only titles become empty slugs', () => {
  assert.equal(createFromTitle('???'), '')
  assert.equal(createFromTitle(''), '')
})

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_CLEANUP_INCOMPLETE,
  DEFAULT_MAX_AGE_MS,
  DEFAULT_MIN_BACKUPS,
  parseBool,
  parseNonNegInt,
  resolveBackupFileRetention,
} from './backupRetention.js'

test('parseNonNegInt accepts integers and numeric strings', () => {
  assert.equal(parseNonNegInt(0), 0)
  assert.equal(parseNonNegInt(10), 10)
  assert.equal(parseNonNegInt('0'), 0)
  assert.equal(parseNonNegInt(' 12 '), 12)
})

test('parseNonNegInt rejects invalid values', () => {
  assert.equal(parseNonNegInt(null), null)
  assert.equal(parseNonNegInt(''), null)
  assert.equal(parseNonNegInt(-1), null)
  assert.equal(parseNonNegInt(1.5), null)
  assert.equal(parseNonNegInt('10abc'), null)
  assert.equal(parseNonNegInt('false'), null)
})

test('parseBool maps common flags', () => {
  assert.equal(parseBool('0', true), false)
  assert.equal(parseBool('false', true), false)
  assert.equal(parseBool('off', true), false)
  assert.equal(parseBool('1', false), true)
  assert.equal(parseBool('yes', false), true)
  assert.equal(parseBool('', true), true)
  assert.equal(parseBool(undefined, true), true)
})

test('defaults when env and config empty', () => {
  assert.deepEqual(resolveBackupFileRetention(), {
    minBackups: DEFAULT_MIN_BACKUPS,
    maxAgeMs: DEFAULT_MAX_AGE_MS,
    cleanupIncomplete: DEFAULT_CLEANUP_INCOMPLETE,
  })
})

test('config fills when env missing', () => {
  assert.deepEqual(resolveBackupFileRetention({
    config: { minBackups: 3, maxAgeMs: 0, cleanupIncomplete: false },
  }), {
    minBackups: 3,
    maxAgeMs: 0,
    cleanupIncomplete: false,
  })
})

test('ENV overrides config', () => {
  assert.deepEqual(resolveBackupFileRetention({
    env: { BACKUP_MIN_COUNT: '1', BACKUP_MAX_AGE_MS: '0', BACKUP_CLEAN_INCOMPLETE: '0' },
    config: { minBackups: 10, maxAgeMs: 99, cleanupIncomplete: true },
  }), {
    minBackups: 1,
    maxAgeMs: 0,
    cleanupIncomplete: false,
  })
})

test('minBackups below 1 clamps to 1', () => {
  assert.equal(resolveBackupFileRetention({ env: { BACKUP_MIN_COUNT: '0' } }).minBackups, 1)
  assert.equal(resolveBackupFileRetention({ config: { minBackups: 0 } }).minBackups, 1)
})

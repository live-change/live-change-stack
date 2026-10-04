import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { removeOldBackups } from './removeOldBackups.js'

const HOUR = 3600 * 1000
const DAY = 24 * HOUR

function stamp(date) {
  const dateString = date.toISOString().slice(0, -1).replace(/[T:\\.-]/gi, '_')
  return dateString.substring(0, dateString.length - 1)
}

async function withTmp(fn) {
  const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'backup-prune-'))
  try {
    await fn(dir)
  } finally {
    await fs.promises.rm(dir, { recursive: true, force: true })
  }
}

async function names(dir) {
  return (await fs.promises.readdir(dir)).sort()
}

async function writeFile(dir, name) {
  await fs.promises.writeFile(path.join(dir, name), 'x')
}

async function mkdir(dir, name) {
  await fs.promises.mkdir(path.join(dir, name))
}

test('minBackups=1 and maxAgeMs=0 keeps newest archive only', async () => {
  await withTmp(async dir => {
    const older = stamp(new Date(Date.now() - 2 * HOUR))
    const newer = stamp(new Date(Date.now() - 1 * HOUR))
    await writeFile(dir, `${older}.tar.gz`)
    await writeFile(dir, `${newer}.tar.gz`)
    await writeFile(dir, 'backups.log')
    await writeFile(dir, 'latest.txt')
    await removeOldBackups(dir, 0, 1, null, { cleanupIncomplete: true })
    assert.deepEqual(await names(dir), [`${newer}.tar.gz`, 'backups.log', 'latest.txt'].sort())
  })
})

test('keeps young extra archives when maxAge is large', async () => {
  await withTmp(async dir => {
    const a = stamp(new Date(Date.now() - 2 * HOUR))
    const b = stamp(new Date(Date.now() - 1 * HOUR))
    const c = stamp(new Date(Date.now() - 30 * 60 * 1000))
    await writeFile(dir, `${a}.tar.gz`)
    await writeFile(dir, `${b}.tar.gz`)
    await writeFile(dir, `${c}.tar.gz`)
    await removeOldBackups(dir, 10 * DAY, 1, null, { cleanupIncomplete: true })
    assert.deepEqual(await names(dir), [`${a}.tar.gz`, `${b}.tar.gz`, `${c}.tar.gz`].sort())
  })
})

test('deletes incomplete timestamp dirs and tar.gz.tmp immediately', async () => {
  await withTmp(async dir => {
    const leftover = stamp(new Date(Date.now() - 5 * 60 * 1000))
    const ready = stamp(new Date(Date.now() - 1 * HOUR))
    await mkdir(dir, leftover)
    await writeFile(dir, `${leftover}.tar.gz.tmp`)
    await writeFile(dir, `${ready}.tar.gz`)
    await removeOldBackups(dir, 10 * DAY, 10, null, { cleanupIncomplete: true })
    assert.deepEqual(await names(dir), [`${ready}.tar.gz`])
  })
})

test('keepPath leaves in-progress directory and matching tmp', async () => {
  await withTmp(async dir => {
    const keep = stamp(new Date(Date.now() - 1 * 60 * 1000))
    const other = stamp(new Date(Date.now() - 2 * 60 * 1000))
    await mkdir(dir, keep)
    await writeFile(dir, `${keep}.tar.gz.tmp`)
    await mkdir(dir, other)
    await writeFile(dir, `${other}.tar.gz.tmp`)
    await removeOldBackups(dir, 0, 1, null, {
      cleanupIncomplete: true,
      keepPath: path.join(dir, keep),
    })
    assert.deepEqual(await names(dir), [keep, `${keep}.tar.gz.tmp`].sort())
  })
})

test('cleanupIncomplete=false only removes dirs older than maxAge', async () => {
  await withTmp(async dir => {
    const oldDir = stamp(new Date(Date.now() - 11 * DAY))
    const youngDir = stamp(new Date(Date.now() - 1 * HOUR))
    const oldTmp = stamp(new Date(Date.now() - 11 * DAY))
    const youngTmp = stamp(new Date(Date.now() - 2 * HOUR))
    await mkdir(dir, oldDir)
    await mkdir(dir, youngDir)
    await writeFile(dir, `${oldTmp}.tar.gz.tmp`)
    await writeFile(dir, `${youngTmp}.tar.gz.tmp`)
    await removeOldBackups(dir, 10 * DAY, 10, null, { cleanupIncomplete: false })
    assert.deepEqual(await names(dir), [youngDir, `${youngTmp}.tar.gz.tmp`].sort())
  })
})

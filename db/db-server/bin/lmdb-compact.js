#!/usr/bin/env node
// Compact-copy LMDB environments to a new directory via mdb_env_copy2 + MDB_CP_COMPACT.
// Source is left unchanged. Destination must not exist.
//
// Usage: node lmdb-compact.js <src> <dst>
//
// If src contains data.mdb, compact-copy that one env to dst.
// Otherwise copy the whole src tree: each *.db subdirectory is compact-copied,
// everything else is copied with fs.cp.

import fs from 'fs'
import path from 'path'
import lmdb from 'node-lmdb'

const MAX_DBS = 1024
const MAP_SIZE = 200 * 1024 * 1024 * 1024

function usage(message) {
  if(message) console.error(message)
  console.error('Usage: node lmdb-compact.js <src> <dst>')
  process.exit(1)
}

function formatBytes(n) {
  if(n == null || Number.isNaN(n)) return 'unknown'
  if(n < 1024) return `${n} B`
  const units = ['KiB', 'MiB', 'GiB', 'TiB']
  let value = n / 1024
  let unit = 0
  while(value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(1)} ${units[unit]}`
}

function dataMdbSize(dir) {
  try {
    return fs.statSync(path.join(dir, 'data.mdb')).size
  } catch(e) {
    return null
  }
}

function hasDataMdb(dir) {
  try {
    return fs.statSync(path.join(dir, 'data.mdb')).isFile()
  } catch(e) {
    return false
  }
}

function isLmdbEnvDir(dir, name) {
  return name.endsWith('.db') && hasDataMdb(dir)
}

function copyEnvCompact(srcPath, dstPath) {
  const before = dataMdbSize(srcPath)
  console.log(`compact ${srcPath} -> ${dstPath} (${formatBytes(before)})`)

  fs.mkdirSync(dstPath, { recursive: true })

  const env = new lmdb.Env()
  env.open({
    path: srcPath,
    maxDbs: MAX_DBS,
    mapSize: MAP_SIZE,
    readOnly: true
  })

  return new Promise((resolve, reject) => {
    env.copy(dstPath, true, (err) => {
      try {
        env.close()
      } catch(closeErr) {
        if(!err) err = closeErr
      }
      if(err) {
        reject(err)
        return
      }
      const after = dataMdbSize(dstPath)
      console.log(`  done ${formatBytes(before)} -> ${formatBytes(after)}`)
      resolve()
    })
  })
}

async function copyTree(srcPath, dstPath) {
  fs.mkdirSync(dstPath, { recursive: true })
  const entries = await fs.promises.readdir(srcPath, { withFileTypes: true })
  for(const entry of entries) {
    const from = path.join(srcPath, entry.name)
    const to = path.join(dstPath, entry.name)
    if(entry.isDirectory() && isLmdbEnvDir(from, entry.name)) {
      await copyEnvCompact(from, to)
    } else {
      console.log(`copy ${from} -> ${to}`)
      await fs.promises.cp(from, to, { recursive: true })
    }
  }
}

async function main() {
  const args = process.argv.slice(2).filter(a => a !== '--')
  if(args.length !== 2) usage()

  const srcPath = path.resolve(args[0])
  const dstPath = path.resolve(args[1])

  let srcStat
  try {
    srcStat = fs.statSync(srcPath)
  } catch(e) {
    usage(`Source does not exist: ${srcPath}`)
  }
  if(!srcStat.isDirectory()) usage(`Source is not a directory: ${srcPath}`)

  if(fs.existsSync(dstPath)) {
    usage(`Destination already exists: ${dstPath}`)
  }

  if(srcPath === dstPath) usage('Source and destination must be different')

  if(hasDataMdb(srcPath)) {
    await copyEnvCompact(srcPath, dstPath)
  } else {
    await copyTree(srcPath, dstPath)
  }

  console.log(`compact-copy complete: ${dstPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

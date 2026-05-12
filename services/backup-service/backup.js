import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'

import fs from 'fs'
import fse from 'fs-extra'
import util from 'util'
import { exec as cpExec } from 'child_process'
const exec = util.promisify(cpExec)
import dump from '@live-change/db-client/lib/dump.js'
import { once } from 'events'
import { finished } from 'node:stream/promises'
import os from "os"
import path from 'path'

function currentBackupPath(backupsDir = './backups/') {
  const dateString = new Date().toISOString().slice(0,-1).replace(/[T:\\.-]/gi, '_')
  return `${backupsDir}/${dateString.substring(0, dateString.length - 1)}`
}

function createBackupLogger(backupsDir) {
  const logPath = path.join(path.resolve(backupsDir), 'backups.log')
  return async function log(message) {
    const line = `${new Date().toISOString()} ${message}\n`
    await fs.promises.appendFile(logPath, line, { encoding: 'utf8' })
  }
}

async function writeDbBackup(stream) {
  let drainPromise
  async function write(object) {
    const code = JSON.stringify(object)
    if(!stream.write(code + '\n')) {
      if(!drainPromise) drainPromise = once(stream, 'drain')
      await drainPromise
      drainPromise = null
    }
  }
  try {
    await dump({
      dao: app.dao,
      db: app.databaseName,
      structure: true,
      verbose: true,
      bucket: 128, // less database stress
      delay: 10 // less database stress
    },
    (method, ...args) => write({ type: 'request', method, parameters: args }),
      () => write({ type: 'sync' })
    )
    stream.end()
    await finished(stream)
  } catch (err) {
    stream.destroy()
    throw err
  }
}

function parseBackupTimestamp(basename) {
  const match = basename.match(/^(\d{4})_(\d{2})_(\d{2})_(\d{2})_(\d{2})_(\d{2})_(\d+)/)
  if(!match) return null
  const [_full, year, month, day, hour, minute, second, millis] = match
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}.${millis}Z`)
}

async function createBackup(backupPath, log) {
  const resolvedPath = path.resolve(backupPath)
  const parentDir = path.dirname(resolvedPath)
  const base = path.basename(resolvedPath)
  const tarTmpPath = path.join(parentDir, `${base}.tar.gz.tmp`)

  await log(`createBackup start backupPath=${resolvedPath}`)

  try {
    await fs.promises.mkdir(resolvedPath)
    await log('mkdir done')

    const dbStream = fs.createWriteStream(path.resolve(resolvedPath, 'db.json'))
    await writeDbBackup(dbStream)
    await log('db dump finished (stream closed)')

    const version = await (
      fs.promises.readFile('./package.json', { encoding: 'utf8' })
        .catch(e => 'unknown')
        .then(data => JSON.parse(data).version)
    )
    const info = {
      version: version,
      hostname: os.hostname(),
      directory: path.resolve('.')
    }

    await fs.promises.writeFile(path.resolve(resolvedPath, 'info.json'), JSON.stringify(info, null, '  '))
    await log('info.json written')

    await fse.copy("./storage", path.resolve(resolvedPath, "storage"))
    await log('storage copied')

    const command = `tar -zcf ../${base}.tar.gz.tmp storage info.json db.json`
    console.log("EXEC TAR COMMAND:", command)
    await log(`tar start command=${command}`)
    await exec(command, { cwd: resolvedPath })
    await log('tar done')

    await fs.promises.rename(tarTmpPath, path.join(parentDir, `${base}.tar.gz`))
    await log('archive renamed to .tar.gz')

    await fse.remove(resolvedPath)
    await log('temp directory removed')

    await log(`createBackup success backupPath=${resolvedPath}`)
  } catch (err) {
    const detail = err && err.stack ? err.stack : String(err)
    await log(`createBackup error: ${detail}`)
    try {
      if(await fse.pathExists(resolvedPath)) {
        await fse.remove(resolvedPath)
        await log(`cleanup removed temp directory ${resolvedPath}`)
      }
    } catch (cleanupErr) {
      await log(`cleanup temp directory failed: ${cleanupErr}`)
    }
    try {
      if(await fse.pathExists(tarTmpPath)) {
        await fse.remove(tarTmpPath)
        await log(`cleanup removed ${tarTmpPath}`)
      }
    } catch (cleanupErr) {
      await log(`cleanup tar tmp failed: ${cleanupErr}`)
    }
    throw err
  }
}

async function removeOldBackups(backupsDir = '../../backups/', maxAge = 10*24*3600*1000, minBackups = 10, log) {
  const resolvedDir = path.resolve(backupsDir)
  const dirents = await fs.promises.readdir(resolvedDir, { withFileTypes: true })
  const now = Date.now()

  const backups = []
  for(const dirent of dirents) {
    if(!dirent.isFile()) continue
    const file = dirent.name
    if(!file.endsWith('.tar.gz')) continue
    const date = parseBackupTimestamp(file.replace(/\.tar\.gz$/, ''))
    if(!date || Number.isNaN(date.getTime())) continue
    backups.push({ file, date })
  }

  backups.sort((a, b) => a.date - b.date)
  const olderBackups = backups
      .slice(0, backups.length - minBackups)
      .filter(backup => now - backup.date > maxAge)
  for(const backup of olderBackups) {
    const backupPath = path.join(resolvedDir, backup.file)
    console.log("REMOVING OLD BACKUP:", backupPath)
    if(log) await log(`removeOldBackups removing archive ${backupPath}`)
    await fse.remove(backupPath)
  }

  for(const dirent of dirents) {
    if(!dirent.isDirectory()) continue
    const name = dirent.name
    const date = parseBackupTimestamp(name)
    if(!date || Number.isNaN(date.getTime())) continue
    if(now - date <= maxAge) continue
    const dirPath = path.join(resolvedDir, name)
    console.log("REMOVING OLD BACKUP DIRECTORY:", dirPath)
    if(log) await log(`removeOldBackups removing stale directory ${dirPath}`)
    await fse.remove(dirPath)
  }
}

export { createBackup, createBackupLogger, currentBackupPath, removeOldBackups }

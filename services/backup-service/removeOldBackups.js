import fs from 'fs'
import fse from 'fs-extra'
import path from 'path'

export function parseBackupTimestamp(basename) {
  const match = basename.match(/^(\d{4})_(\d{2})_(\d{2})_(\d{2})_(\d{2})_(\d{2})_(\d+)/)
  if(!match) return null
  const [_full, year, month, day, hour, minute, second, millis] = match
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}.${millis}Z`)
}

export async function removeOldBackups(backupsDir = '../../backups/', maxAge = 10*24*3600*1000, minBackups = 10, log, options = {}) {
  const resolvedDir = path.resolve(backupsDir)
  const dirents = await fs.promises.readdir(resolvedDir, { withFileTypes: true })
  const now = Date.now()
  const keepCount = Math.max(1, minBackups)
  const cleanupIncomplete = options.cleanupIncomplete !== false
  const keepResolved = options.keepPath ? path.resolve(options.keepPath) : null
  const keepBase = keepResolved ? path.basename(keepResolved) : null
  const keepTmpPath = keepBase ? path.join(path.dirname(keepResolved), `${keepBase}.tar.gz.tmp`) : null

  const backups = []
  for(const dirent of dirents) {
    if(!dirent.isFile()) continue
    const file = dirent.name
    if(!file.endsWith('.tar.gz') || file.endsWith('.tar.gz.tmp')) continue
    const date = parseBackupTimestamp(file.replace(/\.tar\.gz$/, ''))
    if(!date || Number.isNaN(date.getTime())) continue
    backups.push({ file, date })
  }

  backups.sort((a, b) => a.date - b.date)
  const olderBackups = backups
      .slice(0, Math.max(0, backups.length - keepCount))
      .filter(backup => now - backup.date > maxAge)
  for(const backup of olderBackups) {
    const backupPath = path.join(resolvedDir, backup.file)
    console.log("REMOVING OLD BACKUP:", backupPath)
    if(log) await log(`removeOldBackups removing archive ${backupPath}`)
    await fse.remove(backupPath)
  }

  for(const dirent of dirents) {
    if(dirent.isDirectory()) {
      const name = dirent.name
      const date = parseBackupTimestamp(name)
      if(!date || Number.isNaN(date.getTime())) continue
      const dirPath = path.join(resolvedDir, name)
      if(keepResolved && path.resolve(dirPath) === keepResolved) continue
      const stale = now - date > maxAge
      if(!cleanupIncomplete && !stale) continue
      console.log("REMOVING OLD BACKUP DIRECTORY:", dirPath)
      if(log) await log(`removeOldBackups removing stale directory ${dirPath}`)
      await fse.remove(dirPath)
      continue
    }

    if(!dirent.isFile()) continue
    const name = dirent.name
    if(!name.endsWith('.tar.gz.tmp')) continue
    const tmpPath = path.join(resolvedDir, name)
    if(keepTmpPath && path.resolve(tmpPath) === path.resolve(keepTmpPath)) continue
    const date = parseBackupTimestamp(name)
    const stale = date && !Number.isNaN(date.getTime()) && (now - date > maxAge)
    if(!cleanupIncomplete && !stale) continue
    console.log("REMOVING OLD BACKUP TMP:", tmpPath)
    if(log) await log(`removeOldBackups removing tar tmp ${tmpPath}`)
    await fse.remove(tmpPath)
  }
}

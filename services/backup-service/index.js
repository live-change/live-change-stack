import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'
const config = definition.config
export default definition

import express from 'express'
import basicAuth from 'express-basic-auth'
const expressApp = express()
import fs from 'fs'
import { createBackup, createBackupLogger, currentBackupPath, removeOldBackups } from './backup.js'
import { restoreBackup } from './restore.js'
import {
  getLastEventId, removeOldEvents, removeOldOpLogs,
  getLastCommandTimestamp, getLastTriggerTimestamp, removeOldTriggers, removeOldCommands,
  removeOldEventReports
} from './clear.js'

import progress from "progress-stream"

const TWENTY_FOUR_HOURS = 24 * 3600 * 1000
const TEN_MINUTES = 10 * 60 * 1000
const DEFAULT_OP_LOG_RETENTION_MS = 60 * 60 * 1000

let currentBackup = null

const backupServerPort = config.port || process.env.BACKUP_SERVER_PORT || 8007
const backupServerUsername = config.username || process.env.BACKUP_SERVER_USERNAME
const backupServerPassword = config.password || process.env.BACKUP_SERVER_PASSWORD

const backupsDir = config.dir || './backups'

fs.mkdirSync(backupsDir, { recursive: true })

const backupLog = createBackupLogger(backupsDir)

let queue
(async () => {
  const PQueue = (await import('p-queue')).default
  queue = new PQueue({ concurrency: 1 })
})()

let users = config.users || {}
if(backupServerUsername && backupServerPassword ) {
  users[backupServerUsername] = backupServerPassword
}

if(Object.keys(users).length > 0) {
  expressApp.use(basicAuth({
    users,
    challenge: true,
    realm: 'backupServer',
  }))
}

function resolveRetentionMs(option) {
  const value = config[option]
  if(Number.isInteger(value)) return value
  if(value === true && Number.isInteger(config.retentionMs)) return config.retentionMs
  if(value !== false && Number.isInteger(config.retentionMs)) return config.retentionMs
  return null
}

function shouldClear(option) {
  const value = config[option]
  if(value === false) return false
  if(Number.isInteger(value)) return true
  if(value === true) return true
  if(Number.isInteger(config.retentionMs)) return true
  return false
}

function resolveOpLogRetentionMs() {
  if(Number.isInteger(config.opLogRetentionMs)) return config.opLogRetentionMs
  if(config.clearOpLogs === true && Number.isInteger(config.retentionMs)) return config.retentionMs
  if(Number.isInteger(config.clearOpLogs)) return config.clearOpLogs
  return DEFAULT_OP_LOG_RETENTION_MS
}

function resolveEventReportsRetentionMs() {
  if(Number.isInteger(config.clearEventReports)) return config.clearEventReports
  return resolveRetentionMs('clearEventReports')
    ?? resolveRetentionMs('clearCommands')
    ?? resolveRetentionMs('clearTriggers')
}

function computeTimestampCutoff(lastTimestamp, retentionMs) {
  if(retentionMs === null) return null
  const date = new Date(lastTimestamp)
  if(!Number.isInteger(date.getTime())) return null
  return new Date(date.getTime() - retentionMs).toISOString()
}

function computeCutoffs({ lastEventId, lastTriggerTimestamp, lastCommandTimestamp }) {
  const eventsRetention = resolveRetentionMs('clearEvents')
  let eventsBefore = lastEventId
  if(shouldClear('clearEvents') && eventsRetention !== null && lastEventId) {
    const ts = (+(lastEventId.split(':')[0]) - eventsRetention)
    eventsBefore = ts.toFixed(0).padStart(16, '0') + ':'
  } else if(!shouldClear('clearEvents')) {
    eventsBefore = null
  }

  const triggersRetention = resolveRetentionMs('clearTriggers')
  let triggersBefore = lastTriggerTimestamp
  if(shouldClear('clearTriggers')) {
    triggersBefore = computeTimestampCutoff(lastTriggerTimestamp, triggersRetention)
  } else {
    triggersBefore = null
  }

  const commandsRetention = resolveRetentionMs('clearCommands')
  let commandsBefore = lastCommandTimestamp
  if(shouldClear('clearCommands')) {
    commandsBefore = computeTimestampCutoff(lastCommandTimestamp, commandsRetention)
  } else {
    commandsBefore = null
  }

  const eventReportsRetention = resolveEventReportsRetentionMs()
  let eventReportsCommandsBefore = null
  let eventReportsTriggersBefore = null
  if(shouldClear('clearEventReports') && eventReportsRetention !== null) {
    eventReportsCommandsBefore = computeTimestampCutoff(lastCommandTimestamp, eventReportsRetention)
    eventReportsTriggersBefore = computeTimestampCutoff(lastTriggerTimestamp, eventReportsRetention)
  }

  return {
    eventsBefore,
    triggersBefore,
    commandsBefore,
    eventReportsCommandsBefore,
    eventReportsTriggersBefore,
    opLogRetentionMs: shouldClear('clearOpLogs') ? resolveOpLogRetentionMs() : null
  }
}

function doBackup() {
  console.log("DOING BACKUP!")
  if(currentBackup) return currentBackup
  const path = currentBackupPath(backupsDir)
  const filename = path.slice(path.lastIndexOf('/')+1)
  currentBackup = {
    path, filename,
    promise: queue.add(async () => {
      let lastEventId = await getLastEventId()
      let lastTriggerTimestamp = await getLastTriggerTimestamp()
      let lastCommandTimestamp = await getLastCommandTimestamp()

      await removeOldBackups(backupsDir, 10 * TWENTY_FOUR_HOURS, 10, backupLog)
      await createBackup(path, backupLog)

      console.log("====== CLEAR STATS:")
      console.log("Last event id:", lastEventId)
      console.log("Last trigger timestamp:", lastTriggerTimestamp)
      console.log("Last command timestamp:", lastCommandTimestamp)

      const cutoffs = computeCutoffs({ lastEventId, lastTriggerTimestamp, lastCommandTimestamp })

      if(cutoffs.eventsBefore) console.log("Clear events before", new Date(+(cutoffs.eventsBefore.split(':')[0])))
      if(cutoffs.triggersBefore) console.log("Clear triggers before", cutoffs.triggersBefore)
      if(cutoffs.commandsBefore) console.log("Clear commands before", cutoffs.commandsBefore)
      if(cutoffs.eventReportsCommandsBefore) {
        console.log("Clear eventReports (commands) before", cutoffs.eventReportsCommandsBefore)
      }
      if(cutoffs.eventReportsTriggersBefore) {
        console.log("Clear eventReports (triggers) before", cutoffs.eventReportsTriggersBefore)
      }

      console.log("====== CLEARING:")
      console.log("Last remaining event id:", cutoffs.eventsBefore)
      console.log("Last remaining trigger timestamp:", cutoffs.triggersBefore)
      console.log("Last remaining command timestamp:", cutoffs.commandsBefore)

      if(shouldClear('clearEventReports')) {
        await backupLog('clearEventReports start')
        await removeOldEventReports(
          cutoffs.eventReportsCommandsBefore,
          cutoffs.eventReportsTriggersBefore,
          { delay: 10 }
        )
        await backupLog('clearEventReports done')
      }

      if(shouldClear('clearCommands') && cutoffs.commandsBefore) {
        await removeOldCommands(cutoffs.commandsBefore, { delay: 10 })
      }
      if(shouldClear('clearTriggers') && cutoffs.triggersBefore) {
        await removeOldTriggers(cutoffs.triggersBefore, { delay: 10 })
      }
      if(shouldClear('clearEvents') && cutoffs.eventsBefore) {
        await removeOldEvents(cutoffs.eventsBefore)
      }
      if(shouldClear('clearOpLogs') && cutoffs.opLogRetentionMs !== null) {
        await removeOldOpLogs(cutoffs.opLogRetentionMs)
      }
    })
  }
  currentBackup.promise.then(async () => {
    console.log("BACKUP CREATED!")
    await fs.promises.writeFile(backupsDir + '/latest.txt', filename+'.tar.gz')
    currentBackup = null
  }).catch(async err => {
    const detail = err && err.stack ? err.stack : String(err)
    console.error("BACKUP FAILED:", err)
    await backupLog(`backup failed: ${detail}`)
    currentBackup = null
  })
  return currentBackup
}

expressApp.get('/backup/doBackup', async (req, res) => {
  if(currentBackup) {
    res.status(200).send('Backup in progress: ' + currentBackup.filename)
    return
  }
  await queue.add(() => doBackup())
  res.status(200).send('Creating backup: '+currentBackup.filename)
})

expressApp.get('/backup/latest', async (req, res) => {
  const latest = await fs.promises.readFile(backupsDir + '/latest.txt', { encoding: 'utf8' })
  res.status(200).send(`https://${req.get('host')}/backup/download/${latest}`)
})

expressApp.get('/backup', async (req, res) => {
  try {
    const files = await fs.promises.readdir(backupsDir)
    let backupFiles = files.filter(file => file.endsWith('tar.gz'))
        .map(fileName => `https://${req.get('host')}/backup/download/${fileName}`)
        .reverse()
        .join('\n')

    res.status(200).header('Content-Type', 'text/plain').send(backupFiles)
  } catch(err) {
    console.log(err)
  }
})

expressApp.get('/backup/download/:fileName', (req, res) => {
  const { fileName } = req.params
  const file = `${backupsDir}/${fileName}`
  res.status(200).header('Content-Disposition', `attachment; filename="${fileName}"`).download(file)
})

expressApp.post('/backup/upload/:fileName', async (req, res) => {
  const { fileName } = req.params
  const file = `${backupsDir}/${fileName}`

  const size = +req.header('Content-Length')
  console.log("SIZE", size)

  const uploadProgress = progress({
    length: size,
    time: 600
  })
  req.pipe(uploadProgress)
  const fileStream = fs.createWriteStream(file)
  uploadProgress.pipe(fileStream)

  fileStream.on('finish', () => {
    res.status(200)
    res.send("" + uploadProgress.progress().transferred)
  })

  fileStream.on('error', error => {
    res.status(503)
    res.send("Error " + error.toString())
  })
})

let restoringBackup = false
expressApp.post('/restore/:fileName', async (req, res) => {
  const { fileName } = req.params
  throw new Error('not implemented')
  if(restoringBackup) {
    res.status(500)
    res.send(`Restoring backup ${restoringBackup} in progress...`)
    return
  }
  restoringBackup = fileName
  const file = `${backupsDir}/${fileName}`
  await restoreBackup({
    file
  })
  restoringBackup = null
  return 'ok'
})

definition.afterStart(() => {

  expressApp.listen(backupServerPort, () => {
    console.log(`backup port listening on ${backupServerPort}`)
    setTimeout(async () => {
      console.log('Service init backup:')
      await queue.add(() => doBackup())
      console.log('Service init backup completed')
    }, TEN_MINUTES)

    setInterval(async () => {
      console.log('Daily backup:')
      await queue.add(() => doBackup())
      console.log('Daily backup completed')
    }, TWENTY_FOUR_HOURS)
  })

})

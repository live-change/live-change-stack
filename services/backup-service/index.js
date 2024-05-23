import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'
const config = definition.config
export default definition

import express from 'express'
import basicAuth from 'express-basic-auth'
const expressApp = express()
import fs from 'fs'
import { createBackup, currentBackupPath, removeOldBackups } from './backup.js'
import { restoreBackup } from './restore.js'
import { getLastEventId, removeOldEvents } from './clearEvents.js'

import progress from "progress-stream"

const TWENTY_FOUR_HOURS = 24 * 3600 * 1000
const TEN_MINUTES = 10 * 60 * 1000

let currentBackup = null

const backupServerPort = config.port || process.env.BACKUP_SERVER_PORT || 8007
const backupServerUsername = config.username || process.env.BACKUP_SERVER_USERNAME
const backupServerPassword = config.password || process.env.BACKUP_SERVER_PASSWORD

const backupsDir = config.dir || './backups'

fs.mkdirSync(backupsDir, { recursive: true })

let queue
(async () => {
  const PQueue = (await import('p-queue')).default
  queue = new PQueue({ concurrency: 1 })
})()

let users = config.users || {}
if(backupServerUsername && backupServerPassword ) {
  users[backupServerUsername] = backupServerPassword
}

if(Object.keys(users) > 0) {
  expressApp.use(basicAuth({
    users,
    challenge: true,
    realm: 'backupServer',
  }))
}

function doBackup() {
  console.log("DOING BACKUP!")
  if(currentBackup) return currentBackup
  const path = currentBackupPath(backupsDir)
  const filename = path.slice(path.lastIndexOf('/')+1)
  currentBackup = {
    path, filename,
    promise: queue.add(async () => {
      const lastEventId = await getLastEventId()
      await removeOldBackups(backupsDir, 10 * TWENTY_FOUR_HOURS, 10)
      await createBackup(path)
      if(config.clearEvents) await removeOldEvents(lastEventId)
    })
  }
  currentBackup.promise.then(done => {
    console.log("BACKUP CREATED!")
    fs.promises.writeFile(backupsDir + '/latest.txt', filename+'.tar.gz')
    currentBackup = null
  })
  return currentBackup
}

expressApp.get('/backup/doBackup', async (req, res) => {
  if(currentBackup) {
    res.status(200).send('Backup in progress: ' + currentBackup.filename)
    return
  }
  await doBackup()
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

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

definition.beforeStart(() => {

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
const app = require("@live-change/framework").app()
const definition = require('./definition.js')
const config = definition.config

const progress = require('progress-stream')

const uploadsPath = config.uploadsPath || "./storage/uploads/"

const crypto = require("crypto")
const fs = require('fs')

const express = require("express")

fs.mkdirSync(uploadsPath, { recursive: true })

const { Upload } = require("./model.js")

async function setStreamInfo(info) {
  console.dir(info)
  if(info.progress.eta == Infinity) delete info.progress.eta
  await Upload.update(info.id, { ...info, lastUpdate: new Date() })
}

definition.endpoint({
  name: 'upload',
  create() {
    const expressApp = express()
    expressApp.post('/:purpose/:fileName/:id', (req, res) => {
      console.log("HANDLE UPLOAD!")
      const { id, purpose, fileName } = req.params
      console.log("HANDLE UPLOAD", req.params)

      const internalName = id.replace(/[^a-zA-Z0-9\[\]@\.-]/g,"_")
      const path = uploadsPath + internalName

      app.emitEvents(definition.name, [
        {
          type: 'uploadStarted',
          upload: id, purpose, fileName, internalName
        }
      ])

      const maxSize = config.maxSize || 100 * 1024 * 1024

      const size = +req.header('Content-Length')
      if(size == 0 || size > maxSize) {
        req.resume()
        res.status(400)
        res.send("too_big")
        return
      }

      if(config.check) {
        const error = config.check({ id, purpose, fileName, size })
        if(error) {
          req.resume()
          res.status(error.status || 503)
          res.send(error.message || error)
          return
        }
      }

      fs.access(path, fs.constants.F_OK, (err) => {
        if(!err) {
          req.resume()
          res.status(400)
          res.send("file_exists")
          return
        }

        const prog = progress({
          length: size,
          time: 600
        })
        req.pipe(prog)
        const fileStream = fs.createWriteStream(path)
        prog.pipe(fileStream)

        setStreamInfo({
          id, purpose, fileName, internalName,
          progress: prog.progress(),
          state: "uploading"
        })

        prog.on("progress", function(progress) {
          setStreamInfo({
            id, purpose, fileName, internalName,
            progress,
            state: progress.transferred >= size ? "done" : "uploading"
          })
        })

        fileStream.on('finish', () => {
          setStreamInfo({
            id, purpose, fileName, internalName,
            progress: prog.progress(),
            state: "done"
          })

          app.emitEvents(definition.name, [
            { type: 'uploadFinished', upload: id }
          ])

          res.status(200)
          res.send("done")
        })
      })
    })
    expressApp.use('*', async (req, res) => {
      res.writeHead(200, { "Content-Type": "text/plain" })
      res.end("UPLOAD!")
    })
    return expressApp
  }
})

module.exports = {}

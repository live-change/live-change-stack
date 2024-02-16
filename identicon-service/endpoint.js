import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'

import crypto from "crypto"
import Identicon from "identicon.js"
import * as jdenticon from "jdenticon"

import express from "express"

definition.endpoint({
  name: 'identicon',
  create() {
    const expressApp = express()
    expressApp.get('/:uid/:size.svg', (req, res) => {
      const { uid, size } = req.params
      const hash = crypto.createHash("sha1").update(uid).digest("hex")
      const svg = new Identicon(hash, { size, format: "svg" }).toString(true)
      res.writeHead(200, { "Content-Type": "image/svg+xml" })
      res.end(svg)
    })
    expressApp.use('*', async (req, res) => {
      res.writeHead(200, { "Content-Type": "text/plain" })
      res.end("IDENTICON!")
    })
    return expressApp
  }
})

definition.endpoint({
  name: 'jdenticon',
  create() {
    const expressApp = express()
    expressApp.get('/:uid/:size.svg', (req, res) => {
      const { uid, size } = req.params
      const hash = crypto.createHash("sha1").update(uid).digest("hex")
      const svg = jdenticon.toSvg(hash, 200)
      res.writeHead(200, { "Content-Type": "image/svg+xml" })
      res.end(svg)
    })
    expressApp.use('*', async (req, res) => {
      res.writeHead(200, { "Content-Type": "text/plain" })
      res.end("IDENTICON!")
    })
    return expressApp
  }
})

export {}
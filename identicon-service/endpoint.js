const app = require("@live-change/framework").app()
const definition = require('./definition.js')

const crypto = require("crypto")
const Identicon = require("identicon.js")
const jdenticon = require("jdenticon")

const express = require("express")

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

module.exports = {}
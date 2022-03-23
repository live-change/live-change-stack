const app = require("@live-change/framework").app()
const definition = require('./definition.js')

const storageDir = `./storage/images/`
const uploadsDir = `./uploads/`

const express = require("express")

definition.endpoint({
  name: 'image',
  create() {
    const expressApp = express()
    expressApp.get('/:image/:version/width-:width.:format', (req, res) => handleImageGet(req, res, {
      ...req.params,
      type: "width"
    }))
    expressApp.get('/:image/:version/width-:width', (req, res) => handleImageGet(req, res, {
      ...req.params,
      type: "width"
    }))
    expressApp.get('/:image/:version/height-:height.:format', (req, res) => handleImageGet(req, res, {
      ...req.params,
      type: "height"
    }))
    expressApp.get('/:image/:version/height-:height', (req, res) => handleImageGet(req, res, {
      ...req.params,
      type: "height"
    }))
    expressApp.get('/:image/:version/rect-:width-:height.:format', (req, res) => handleImageGet(req, res, {
      ...req.params,
      type: "rect"
    }))
    expressApp.get('/:image/:version/rect-:width-:height', (req, res) => handleImageGet(req, res, {
      ...req.params,
      type: "rect"
    }))
    expressApp.get('/:image/:version.:format', (req, res) => handleImageGet(req, res, {
      ...req.params,
      type: "auto"
    }))
    expressApp.get('/:image/:version', (req, res) => handleImageGet(req, res, {
      ...req.params,
      type: "auto"
    }))
    
    return expressApp
  }
})

module.exports = {}
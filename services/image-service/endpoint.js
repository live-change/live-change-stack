import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'

import { Image } from './image.js'

import fs from "fs"
import path from "path"
import sharp from 'sharp'

const config = definition.config

const imagesPath = config.imagesPath || `./storage/images/`

import Debug from 'debug'
const debug = Debug("image-service:endpoint")

function normalizeFormat(f1) {
  f1 = f1.toLowerCase().trim()
  if(f1 === 'jpg') f1 = 'jpeg'
  return f1
}

function isFormatsIdentical(f1, f2) {
  return normalizeFormat(f1) === normalizeFormat(f2)
}

function fileExists(fn) {
  return new Promise((resolve, reject) => {
    fs.access(fn, fs.F_OK, (err) => {
      resolve(!err)
    })
  })
}

function delay(ms) {
  return new Promise((resolve, reject) => setTimeout(resolve, ms))
}
async function getImageMetadata(image, version) {
  for(let t = 0; t < 5; t++) {
    const metadata = await Image.get(image)
    debug("METADATA READ RESULT", metadata)
    if(metadata) return metadata
    await delay(200 * Math.pow(2, t))
  }
  return null
}

function sanitizeImageId(id) {
  return id.replace(/[^a-zA-Z0-9\[\]@\.-]/g,"_")
}

async function handleImageGet(req, res, params) {
  const { image } = params
  const metadata = await getImageMetadata(image)
  debug("PIC METADATA", image, "=>", metadata)
  if(!metadata) {
    res.status(404)
    res.send("Image " + image + " not found")
    return
  }
  const imagePrefix = imagesPath + sanitizeImageId(image) + '/'
  const sourceFilePath = path.resolve(imagePrefix + 'original.' + metadata.extension)
  debug("SOURCE IMAGE PATH", sourceFilePath)
  if(!(await fileExists(sourceFilePath))) {
    res.status(404)
    console.error("IMAGE FILE NOT FOUND", sourceFilePath)
    res.send("Image file not found")
    return
  }

  const kernel = "lanczos3"

  switch(params.type) {
    case "original": {
      if(params.format && !isFormatsIdentical(params.format, metadata.extension)) {
        debug("CONVERTING IMAGE!", metadata.extension, params.format)
        const normalized = normalizeFormat(params.format)
        const convertedFilePath = path.resolve(imagePrefix + 'converted.' + normalized)
        if(!(await fileExists(convertedFilePath))) {
          await sharp(sourceFilePath).toFile(convertedFilePath)
        }
        res.sendFile(convertedFilePath)
      } else res.sendFile(sourceFilePath)
    } break;
    case "width": {
      const width = +params.width
      if(!(width > 0)) {
        res.status(400)
        res.send("Bad parameter value")
        return
      }
      if(width >= metadata.width) return res.sendFile(sourceFilePath)
      const normalized = normalizeFormat(params.format || metadata.extension)
      const convertedFilePath = path.resolve(imagePrefix + `width-${width}.${normalized}`)
      if(!(await fileExists(convertedFilePath))) {
        await sharp(sourceFilePath)
            .resize({
              width,
              kernel
            })
            .toFile(convertedFilePath)
      }
      res.sendFile(convertedFilePath)
    } break;
    case "height": {
      const height = +params.height
      if(!(height > 0)) {
        res.status(400)
        res.send("Bad parameter value")
        return
      }
      if(height >= metadata.height) return res.sendFile(sourceFilePath)
      const normalized = normalizeFormat(params.format || metadata.extension)
      const convertedFilePath = path.resolve(imagePrefix + `height-${height}.${normalized}`)
      if(!(await fileExists(convertedFilePath))) {
        await sharp(sourceFilePath)
            .resize({
              height,
              kernel
            })
            .toFile(convertedFilePath)
      }
      res.sendFile(convertedFilePath)
    } break;
    case "rect": {
      let width = +params.width
      let height = +params.height
      if(!(height > 0 && width>0)) {
        res.status(400)
        res.send("Bad parameter value")
        return
      }
      if(height > metadata.height) {
        width = Math.round(width * metadata.height / height)
        height = metadata.height
      }
      if(width > metadata.width) {
        height = Math.round(height * metadata.width / width)
        width = metadata.width
      }
      if(width == metadata.width && height == metadata.height) return res.sendFile(sourceFilePath)
      const normalized = normalizeFormat(params.format || metadata.extension)
      const convertedFilePath = path.resolve(imagePrefix + `rect-${width}-${height}.${normalized}`)
      if(!(await fileExists(convertedFilePath))) {
        await sharp(sourceFilePath)
            .resize({
              width, height,
              fit: sharp.fit.cover,
              position: sharp.strategy.attention,
              kernel
            })
            .toFile(convertedFilePath)
      }
      res.sendFile(convertedFilePath)
    }
  }
}


import express from "express"

definition.endpoint({
  name: 'image',
  create() {
    const expressApp = express()
    expressApp.get('/:image/width-:width.:format',
        (req, res) => handleImageGet(req, res, { ...req.params, type: "width" })
    )
    expressApp.get('/:image/width-:width',
        (req, res) => handleImageGet(req, res, { ...req.params, type: "width" })
    )
    expressApp.get('/:image/height-:height.:format',
        (req, res) => handleImageGet(req, res, { ...req.params, type: "height" })
    )
    expressApp.get('/:image/height-:height',
        (req, res) => handleImageGet(req, res, { ...req.params, type: "height" })
    )
    expressApp.get('/:image/rect-:width-:height.:format',
        (req, res) => handleImageGet(req, res, { ...req.params, type: "rect" })
    )
    expressApp.get('/:image/rect-:width-:height',
        (req, res) => handleImageGet(req, res, { ...req.params, type: "rect" })
    )
    expressApp.get('/:image/.:format',
        (req, res) => handleImageGet(req, res, { ...req.params, type: "original" })
    )
    expressApp.get('/:image',
        (req, res) => handleImageGet(req, res, { ...req.params, type: "original" })
    )
    expressApp.use('*', async (req, res) => {
      res.writeHead(200, { "Content-Type": "text/plain" })
      res.end("IMAGE!")
    })
    return expressApp
  }
})

export {}

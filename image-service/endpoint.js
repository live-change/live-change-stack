const app = require("@live-change/framework").app()
const definition = require('./definition.js')

const { Image } = require('./image.js')

const fs = require("fs")
const path = require("path")
const sharp = require('sharp')

const config = definition.config

const imagesPath = config.imagesPath || `./storage/images/`

function normalizeFormat(f1) {
  f1 = f1.toLowerCase().trim()
  if(f1 == 'jpg') f1 = 'jpeg'
  return f1
}

function isFormatsIdentical(f1, f2) {
  return normalizeFormat(f1) == normalizeFormat(f2)
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
async function getImageMetadata(picture, version) {
  for(let t = 0; t < 5; t++) {
    const metadata = await Image.get(picture)
    console.log("MD", metadata)
    if(metadata.original && metadata[version]) return metadata
    await delay(200 * Math.pow(2, t))
  }
  return null
}

function sanitizeImageId(id) {
  return id.replace(/[^a-zA-Z0-9\[\]@\.-]/g,"_")
}

async function handleImageGet(req, res, params) {
  const { picture, version } = params
  const metadata = await getImageMetadata(picture, version)
  console.log("PIC METADATA", picture, version, "=>", metadata)
  if(!metadata) {
    res.status(404)
    res.send("Picture not found")
    return
  }
  const imagePrefix = imagesPath + sanitizeImageId(picture) + '/' + version.replace(/[^a-zA-Z0-9-]/g,"_")
  const sourceFilePath = path.resolve(imagePrefix + '.' + metadata.original.extension)
  console.log("SOURCE PIC PATH", sourceFilePath)
  if(!(await fileExists(sourceFilePath))) {
    res.status(404)
    console.error("PICTURE FILE NOT FOUND", sourceFilePath)
    res.send("Picture file not found")
    return
  }

  const kernel = "lanczos3"

  switch(params.type) {
    case "auto": {
      if(params.format && !isFormatsIdentical(params.format, metadata.original.extension)) {
        console.log("CONVERTING PICTURE!", metadata.original.extension, params.format)
        const normalized = normalizeFormat(params.format)
        const convertedFilePath = path.resolve(imagePrefix + '.' + normalized)
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
      //if(width > metadata.original.width) return res.sendFile(sourceFilePath)
      const normalized = normalizeFormat(params.format || metadata.original.extension)
      const convertedFilePath = path.resolve(imagePrefix + `-width-${width}.${normalized}`)
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
      //if(height > metadata.original.height) return res.sendFile(sourceFilePath)
      const normalized = normalizeFormat(params.format || metadata.original.extension)
      const convertedFilePath = path.resolve(imagePrefix + `-height-${height}.${normalized}`)
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
      const width = +params.width
      const height = +params.height
      if(!(height > 0 && width>0)) {
        res.status(400)
        res.send("Bad parameter value")
        return
      }
      //if(height > metadata.original.height) return res.sendFile(sourceFilePath)
      //if(width > metadata.original.width) return res.sendFile(sourceFilePath)
      const normalized = normalizeFormat(params.format || metadata.original.extension)
      const convertedFilePath = path.resolve(imagePrefix + `-rect-${width}-${height}.${normalized}`)
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


const express = require("express")

definition.endpoint({
  name: 'image',
  create() {
    const expressApp = express()
    expressApp.get('/:image/:version/width-:width.:format',
        (req, res) => handleImageGet(req, res, { ...req.params, type: "width" })
    )
    expressApp.get('/:image/:version/width-:width',
        (req, res) => handleImageGet(req, res, { ...req.params, type: "width" })
    )
    expressApp.get('/:image/:version/height-:height.:format',
        (req, res) => handleImageGet(req, res, { ...req.params, type: "height" })
    )
    expressApp.get('/:image/:version/height-:height',
        (req, res) => handleImageGet(req, res, { ...req.params, type: "height" })
    )
    expressApp.get('/:image/:version/rect-:width-:height.:format',
        (req, res) => handleImageGet(req, res, { ...req.params, type: "rect" })
    )
    expressApp.get('/:image/:version/rect-:width-:height',
        (req, res) => handleImageGet(req, res, { ...req.params, type: "rect" })
    )
    expressApp.get('/:image/:version.:format',
        (req, res) => handleImageGet(req, res, { ...req.params, type: "auto" })
    )
    expressApp.get('/:image/:version',
        (req, res) => handleImageGet(req, res, { ...req.params, type: "auto" })
    )
    return expressApp
  }
})

module.exports = {}
const definition = require('./definition.js')

const config = definition.config
const uploadConfig = config.upload || {}

const {
  maxUploadSize = 10 * 1024 * 1024,
  maxUploadWidth = 2048,
  maxUploadHeight = 2048,
  maxProcessableSize = 50 * 1024 * 1025,
  maxProcessableWidth = 10000,
  maxProcessableHeight = 10000,
  maxProcessablePixels = 6000*6000
} = uploadConfig

definition.clientConfig = {
  maxUploadSize,
  maxUploadWidth,
  maxUploadHeight,
  maxProcessableSize,
  maxProcessableWidth,
  maxProcessableHeight,
  maxProcessablePixels
}

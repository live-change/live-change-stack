import {
  imageToCanvas, loadImageUpload, cancelOrientation, hasAlpha, isExifOrientationSupported, loadImage
} from "./imageUtils.js"
import imageResizer from "./imageResizer"

async function preProcessImageFile({ file, image, canvas }, config) {

  const {
    maxUploadSize = 10 * 1024 * 1024,
    maxUploadWidth = 2048,
    maxUploadHeight = 2048,
    maxProcessableSize = 50 * 1024 * 1025,
    maxProcessableWidth = 10000,
    maxProcessableHeight = 10000,
    maxProcessablePixels = 6000 * 6000
  } = config

  if(!file && !image && !canvas) {
    throw new Error('noImage')
  }

  if (file?.size > maxProcessableSize) {
    throw new Error("tooBig")
  }

  if(!image) {
    if(canvas) {
      image = {
        width: canvas.width,
        height: canvas.height,
        orientation: 0,
        type: config.fileType || 'image/png',
        image: null // not needed because we have canvas
      }
    } else {
      image = await loadImageUpload(file)
    }
  }

  if (image.width > maxProcessableWidth
      || image.height > maxProcessableHeight
      || (image.width * image.height) > maxProcessablePixels) {
    throw new Error("tooBig")
  }

  let processingNeeded =
      image.width > maxUploadWidth
      || image.height > maxUploadHeight
      || image.orientation

  if(!processingNeeded) {
    if(!file) {
      if(!canvas) canvas = imageToCanvas(image.image)
      file = await new Promise(
        (resolve, reject) => canvas.toBlob(resolve, config.fileType || 'image/png')
      )
    }
  }

  processingNeeded ||= file.size > maxUploadSize

  if(!processingNeeded) {
    return {
      blob: file, canvas,
      size: { width: image.width, height: image.height }
    }
  }

  if(!canvas) canvas = imageToCanvas(image.image)

  const exifOrientationSupported = (await isExifOrientationSupported())

  if(image.width > maxUploadWidth || image.height > maxUploadHeight ) { /// RESIZING NEEDED
    const maxRatio = maxUploadWidth / maxUploadHeight
    const inputRatio = image.width / image.height

    let targetWidth, targetHeight
    if(inputRatio > maxRatio) { /// scale to max width
      targetWidth = maxUploadWidth
      targetHeight = Math.round(maxUploadWidth / inputRatio)
    } else { /// scale to max height
      let scale = maxUploadHeight / image.height
      targetWidth = Math.round(maxUploadHeight * inputRatio)
      targetHeight = maxUploadHeight
    }

    console.log(`RESIZING ${image.width}x${image.height} => ${targetWidth}x${targetHeight}`)

    let [destWidth, destHeight] =
      (image.orientation > 4/* && !exifOrientationSupported*/) /// use orientation when scaling even if supported!
      ? [targetHeight, targetWidth]
      : [targetWidth, targetHeight]
    let destCanvas = document.createElement('canvas')
    destCanvas.width = destWidth
    destCanvas.height = destHeight
    try {
      await imageResizer.resize(canvas, destCanvas, {
        unsharpAmount: 80,
        unsharpRadius: 0.6,
        unsharpThreshold: 2,
        alpha: hasAlpha(canvas)
      })
    } catch (e) {
      const context = destCanvas.getContext('2d')
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'
      context.drawImage(canvas, 0, 0, destCanvas.width, destCanvas.height)
    }
    canvas = destCanvas
  }

  if(image.orientation && !exifOrientationSupported) {
    // if exif orientation is supoorted it will be automatically canceled!
    console.log("CANCEL ORIENTATION", image.orientation)
    canvas = cancelOrientation(canvas, image.orientation)
  }

  const blob = await new Promise(
      (resolve, reject) => canvas.toBlob(resolve, file?.type || config.fileType || 'image/png')
  )
  console.log("OUTPUT CANVAS", canvas.width, canvas.height)
  console.log("OUTPUT BLOB", blob)
  blob.name = file.name

  return {
    blob, canvas,
    size: { width: canvas.width, height: canvas.height }
  }

}

export default preProcessImageFile

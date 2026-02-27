import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'
const config = definition.config

const imagesPath = config.imagesPath || `./storage/images/`
const uploadsPath = config.uploadsPath || `./storage/uploads/`

const cropInfo = {
  type: Object,
  properties: {
    originalImage: {
      type: String
    },
    x: { type: Number },
    y: { type: Number },
    zoom: { type: Number, defaultValue: 1 },
    orientation: { type: Number }
  }
}

const Image = definition.model({
  name: "Image",
  itemOfAny: {
    readAccess: () => true,
  },
  properties: {
    name: {
      type: String
    },
    fileName: {
      type: String
    },
    width: {
      type: Number,
      validation: ['nonEmpty']
    },
    height: {
      type: Number,
      validation: ['nonEmpty']
    },
    extension: {
      type: String,
      validation: ['nonEmpty']
    },
    purpose: {
      type: String,
      validation: ['nonEmpty']
    },
    crop: cropInfo
  }
})

import { move, copy, mkdir, rmdir } from './fsUtils.js'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import download from 'download'

fs.mkdirSync(imagesPath, { recursive: true })

const Upload = definition.foreignModel('upload', 'Upload')

definition.action({
  name: "createImage",
  properties: {
    image: {
      type: Image
    },
    name: {
      type: String,
      validation: ['nonEmpty']
    },
    width: {
      type: Number,
      validation: ['nonEmpty']
    },
    height: {
      type: Number,
      validation: ['nonEmpty']
    },
    upload: {
      type: Upload,
      validation: ['nonEmpty']
    },
    purpose: {
      type: String,
      validation: ['nonEmpty']
    },
    ownerType: {
      type: String,
      validation: ['nonEmpty']
    },
    owner: {
      type: String,
      validation: ['nonEmpty']
    },
    crop: cropInfo
  },
  /// TODO: accessControl!
  waitForEvents: true,
  async execute({ image, name, width, height, upload, purpose, owner, ownerType, crop }, { client, service }, emit) {
    if(!image) {
      image = app.generateUid()
    } else {
      // TODO: check id source session
      const existing = await Image.get(image)
      if (existing) throw app.logicError("already_exists")
    }
    const uploadRow = await Upload.get(upload)
    if(!uploadRow) throw new Error("upload_not_found")
    if(uploadRow.state !== 'done') throw new Error("upload_not_done")

    let extension = uploadRow.fileName.match(/\.([A-Z0-9]+)$/i)[1].toLowerCase()
    if(extension === 'jpg') extension = "jpeg"
    const dir = `${imagesPath}${image}`

    emit({
      type: "ImageCreated",
      image,
      identifiers: {
        owner, ownerType
      },
      data: {
        name, purpose,
        fileName: uploadRow.fileName,
        width, height, extension, crop
      }
    })

    await mkdir(dir)
    await move(`${uploadsPath}${uploadRow.id}`, `${dir}/original.${extension}`)

    await app.trigger({ type: 'uploadUsed' }, {
      upload: uploadRow.id
    })

    return image
  }
})


definition.trigger({
  name: "setupExistingImage",
  properties: {
    image: {
      type: Image
    },
    name: {
      type: String,
      validation: ['nonEmpty']
    },
    width: {
      type: Number
    },
    height: {
      type: Number
    },
    purpose: {
      type: String,
      validation: ['nonEmpty']
    },
    ownerType: {
      type: String,
      validation: ['nonEmpty']
    },
    owner: {
      type: String,
      validation: ['nonEmpty']
    },
    fileName: {
      type: String,
      validation: ['nonEmpty']
    },
    crop: cropInfo
  },
  waitForEvents: true,
  async execute({ image, name, width, height, fileName, purpose, owner, ownerType, crop }, { client, service }, emit) {
    if(!image) throw new Error("image_not_found")
    const existing = await Image.get(image)
    if (existing) throw app.logicError("already_exists")

    let extension = fileName.match(/\.([A-Z0-9]+)$/i)[1].toLowerCase()
    if(extension === 'jpg') throw new Error('jpg should have jpeg extension')

    if(!width || !height) {
      const path = `${imagesPath}/${image}/original.${extension}`
      const data = await fs.promises.readFile(path)
      const metadata = await sharp(data).metadata()
      width = metadata.width
      height = metadata.height
    }

    emit({
      type: "ImageCreated",
      image,
      identifiers: {
        owner, ownerType
      },
      data: {
        name, purpose,
        fileName,
        width, height, extension, crop
      }
    })

    return image
  }
})

definition.trigger({
  name: "createImageFromUrl",
  properties: {
    name: {
      type: String,
      validation: ['nonEmpty']
    },
    purpose: {
      type: String,
      validation: ['nonEmpty']
    },
    url: {
      type: String,
      validation: ['nonEmpty']
    },
    cropped: {
      type: Boolean,
      defaultValue: true
    },
    ownerType: {
      type: String,
      validation: ['nonEmpty']
    },
    owner: {
      type: String,
      validation: ['nonEmpty']
    }
  },
  waitForEvents: true,
  async execute({ name, purpose, url, owner, ownerType }, { service, client }, emit) {
    const image = app.generateUid()

    const downloadPath = `${uploadsPath}download_${image}`
    await download(url, uploadsPath, { filename: `download_${image}` })

    /*
    console.log("DOWNLOADED", url, uploadsPath, '=>', downloadPath)
    const downloadExists = await fs.promises.access(downloadPath, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false)
    console.log("DOWNLOAD EXISTS", downloadExists)//*/

    const data = await fs.promises.readFile(downloadPath)
    const metadata = await sharp(data).metadata()
    //const metadata = await sharp(downloadPath).metadata()

    //console.log("IMAGE METADATA", metadata)

    emit({
      type: "ImageCreated",
      image,
      identifiers: {
        owner, ownerType
      },
      data: {
        name, purpose,
        fileName: url.split('/').pop(),
        width: metadata.width,
        height: metadata.height,
        extension: metadata.format,
        crop: null
      }
    })

    const dir = `${imagesPath}/${image}`

    await mkdir(dir)
    await move(downloadPath, `${dir}/original.${metadata.format}`)

    return image
  }
})


definition.trigger({
  name: "createImageFromDownloadedFile",
  properties: {
    name: {
      type: String,
      validation: ['nonEmpty']
    },
    purpose: {
      type: String,
      validation: ['nonEmpty']
    },
    downloadPath: {
      type: String,
      validation: ['nonEmpty']
    },
    cropped: {
      type: Boolean,
      defaultValue: true
    },
    ownerType: {
      type: String,
      validation: ['nonEmpty']
    },
    owner: {
      type: String,
      validation: ['nonEmpty']
    }
  },
  waitForEvents: true,
  async execute({ name, purpose, downloadPath, owner, ownerType }, { service, client }, emit) {
    const image = app.generateUid()

    /*
    console.log("DOWNLOADED", url, uploadsPath, '=>', downloadPath)
    const downloadExists = await fs.promises.access(downloadPath, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false)
    console.log("DOWNLOAD EXISTS", downloadExists)//*/

    const data = await fs.promises.readFile(downloadPath)
    const metadata = await sharp(data).metadata()
    //const metadata = await sharp(downloadPath).metadata()

    //console.log("IMAGE METADATA", metadata)

    emit({
      type: "ImageCreated",
      image,
      identifiers: {
        owner, ownerType
      },
      data: {
        name, purpose,
        fileName: downloadPath.split('/').pop(),
        width: metadata.width,
        height: metadata.height,
        extension: metadata.format,
        crop: null
      }
    })

    const dir = `${imagesPath}/${image}`

    await mkdir(dir)
    await move(downloadPath, `${dir}/original.${metadata.format}`)

    return image
  }
})

definition.trigger({
  name: 'deleteImage_Image',
  properties: {
    object: {
      type: Image,
      validation: ['nonEmpty']
    }
  },
  async execute({ object: image }, { client, service }, emit) {
    const imageDir = `${imagesPath}${image}`
    await rmdir(imageDir)
  }
})

export { Image }

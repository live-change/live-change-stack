const app = require("@live-change/framework").app()
const definition = require('./definition.js')
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

const { move, copy, mkdir, rmdir } = require('./fsUtils')
const fs = require('fs')
const sharp = require('sharp')
const download = require('download')

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
      if (existing) throw 'already_exists'
    }
    const uploadRow = await Upload.get(upload)
    if(!uploadRow) throw new Error("upload_not_found")
    if(uploadRow.state!='done') throw new Error("upload_not_done")

    let extension = uploadRow.fileName.match(/\.([A-Z0-9]+)$/i)[1].toLowerCase()
    if(extension == 'jpg') extension = "jpeg"
    const dir = `${imagesPath}${image}`

    emit({
      type: "ownerOwnedImageCreated",
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

    await app.trigger({
      type: 'uploadUsed',
      upload: uploadRow.id
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

    const metadata = await sharp(downloadPath).metadata()

    emit({
      type: "ownerOwnedImageCreated",
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

definition.view({
  name: 'image',
  properties: {
    image: {
      type: Image,
      validation: ['nonEmpty']
    }
  },
  returns: {
    type: Image
  },
  daoPath({ image }, { client, context }) {
    return Image.path( image )
  }
})

module.exports = { Image }

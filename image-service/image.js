const app = require("@live-change/framework").app()
const definition = require('./definition.js')

const storageDir = `./storage/images/`
const uploadsDir = `./uploads/`

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
    original: {
      type: Object,
      properties: {
        width: { type: Number },
        height: { type: Number },
        extension: { type: String }
      }
    },
    crop: {
      type: Object,
      properties: {
        x: { type: Number },
        y: { type: Number },
        width: { type: Number },
        height: { type: Number },
        zoom: { type: Number, defaultValue: 1 },
        orientation: {type: Number}
      }
    },
    purpose: {
      type: String,
      validation: ['nonEmpty']
    }
  }
})

const { move, copy, mkdir, rmdir } = require('./fsUtils')
const sharp = require('sharp')
const download = require('download')

definition.action({
  name: "createEmptyImage",
  properties: {
    name: {
      type: String,
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
    }
  },
  /// TODO: accessControl
  async execute({ name, purpose, owner, ownerType }, { client, service }, emit) {
    const image = app.generateUid()

    const dir = `${storageDir}${image}`

    emit({
      type: "ownerOwnedImageCreated",
      image,
      identifiers: {
        owner, ownerType
      },
      data: {
        name, purpose,
        fileName: null,
        original: null,
        crop: null
      }
    })

    await mkdir(dir)
    await mkdir(`${dir}/originalCache`)
    await mkdir(`${dir}/cropCache`)

    return image
  }
})

definition.action({
  name: "uploadImage",
  properties: {
    image: {
      type: Image
    },
    original: {
      type: Object,
      properties: {
        width: { type: Number },
        height: { type: Number },
        uploadId: { type: String }
      }
    }
  },
  /// TODO: accessControl!
  waitForEvents: true,
  async execute({ image, original }, { client, service }, emit) {
    const upload = await app.dao.get(['database', 'tableObject', app.databaseName, 'uploads', original.uploadId])
    if(!upload) throw new Error("upload_not_found")
    if(upload.state!='done') throw new Error("upload_not_done")

    let extension = upload.fileName.match(/\.([A-Z0-9]+)$/i)[1].toLowerCase()
    if(extension == 'jpg') extension = "jpeg"
    const dir = `${storageDir}${image}`

    emit({
      type: "ownerOwnedImageUpdated",
      image,
      data: {
        fileName: upload.fileName,
        original: {
          width: original.width,
          height: original.height,
          extension
        },
        crop: null
      }
    })

    await move(`${uploadsDir}${upload.id}`, `${dir}/original.${extension}`)
    await app.dao.request(['database', 'delete'], app.databaseName, 'uploads', upload.id)

    return image
  }
})

definition.action({
  name: "createImage",
  properties: {
    name: {
      type: String,
      validation: ['nonEmpty']
    },
    original: {
      type: Object,
      properties: {
        width: { type: Number },
        height: { type: Number },
        uploadId: { type: String }
      }
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
    }
  },
  /// TODO: accessControl!
  waitForEvents: true,
  async execute({ name, original, purpose }, { client, service }, emit) {
    const image = app.generateUid()
    const upload = await app.dao.get(['database', 'tableObject', app.databaseName, 'uploads', original.uploadId])

    if(!upload) throw new Error("upload_not_found")
    if(upload.state!='done') throw new Error("upload_not_done")

    let extension = upload.fileName.match(/\.([A-Z0-9]+)$/i)[1].toLowerCase()
    if(extension == 'jpg') extension = "jpeg"
    const dir = `${storageDir}${image}`

    emit({
      type: "ownerOwnedImageCreated",
      image,
      identifiers: {
        owner, ownerType
      },
      data: {
        name,
        purpose,
        fileName: upload.fileName,
        original: {
          width: original.width,
          height: original.height,
          extension
        },
        crop: null,
        owner: client.user
      }
    })

    await mkdir(dir)
    await mkdir(`${dir}/originalCache`)
    await mkdir(`${dir}/cropCache`)
    await move(`${uploadsDir}${upload.id}`, `${dir}/original.${extension}`)
    await app.dao.request(['database', 'delete'], app.databaseName, 'uploads', upload.id)

    return image
  }
})

definition.action({
  name: "cropImage",
  properties: {
    image: {
      type: Image
    },
    crop: {
      type: Object,
      properties: {
        x: {type: Number},
        y: {type: Number},
        width: {type: Number},
        height: {type: Number},
        zoom: {type: Number, defaultValue: 1},
        orientation: {type: Number}
      }
    },
    uploadId: {type: String}
  },
  /// TODO: accessControl!
  waitForEvents: true,
  async execute({ image, crop, uploadId }, {client, service}, emit) {
    const imageRow = await Image.get(image)
    if(!imageRow) throw new Error("not_found")

    const upload = await app.dao.get(['database', 'tableObject', app.databaseName, 'uploads', uploadId])

    console.log("UPLOAD CROP", upload)

    if(!upload) throw new Error("upload_not_found")
    if(upload.state != 'done') throw new Error("upload_not_done")

    console.log("CURRENT IMAGE ROW", image, imageRow)
    if(!imageRow.crop) { // first crop
      const dir = `${storageDir}${image}`
      let extension = upload.fileName.match(/\.([A-Z0-9]+)$/i)[1].toLowerCase()
      if(extension == 'jpg') extension = "jpeg"

      await move(`${uploadsDir}${upload.id}`, `${dir}/crop.${extension}`)
      await app.dao.request(['database', 'delete'], app.databaseName, 'uploads', upload.id)

      emit({
        type: "ownerOwnedImageUpdated",
        image,
        data: {
          crop
        }
      })

      return image
    } else { // next crop - need to copy image
      const newImage = app.generateUid()

      const dir = `${storageDir}${image}`
      const newDir = `${storageDir}${newImage}`

      await mkdir(newDir)
      await mkdir(`${newDir}/originalCache`)
      await mkdir(`${newDir}/cropCache`)
      await move(`${dir}/original.${imageRow.original.extension}`,
          `${newDir}/original.${imageRow.original.extension}`)

      let extension = upload.fileName.match(/\.([A-Z0-9]+)$/i)[1].toLowerCase()
      if(extension == 'jpg') extension = "jpeg"

      await move(`../../storage/uploads/${upload.id}`, `${newDir}/crop.${extension}`)
      await app.dao.request(['database', 'delete'], app.databaseName, 'uploads', upload.id)

      const { owner, ownerType } = imageRow

      emit({
        type: "ownerOwnedImageCreated",
        image,
        identifiers: {
          owner, ownerType
        },
        data: {
          name: imageRow.name,
          purpose: imageRow.purpose,
          fileName: upload.fileName,
          original: imageRow.original,
          crop
        }
      })

      return newImage
    }
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
  async execute({ name, purpose, url, cropped, owner, ownerType }, { service, client }, emit) {
    const image = app.generateUid()

    const downloadPath = `${uploadsDir}download_${image}`
    await download(url, uploadsDir, { filename: `download_${image}` })

    const metadata = await sharp(downloadPath).metadata()

    let data = {
      name,
      purpose,
      fileName: url.split('/').pop(),
      original: {
        width: metadata.width,
        height: metadata.height,
        extension: metadata.format
      },
      crop: null
    }

    if(cropped) {
      data.crop = {
        x: 0,
        y: 0,
        width: metadata.width,
        height: metadata.height,
        zoom: 1,
        orientation: 0
      }
    }

    emit({
      type: "ImageCreated",
      image,
      data
    })

    emit({
      type: "ownerOwnedImageCreated",
      image,
      identifiers: {
        owner, ownerType
      },
      data
    })

    const dir = `${storageDir}/${image}`

    await mkdir(dir)
    await mkdir(`${dir}/originalCache`)
    await mkdir(`${dir}/cropCache`)
    await move(downloadPath, `${dir}/original.${metadata.format}`)
    if(cropped) await copy(`${dir}/original.${metadata.format}`, `${dir}/crop.${metadata.format}`)

    return image
  }
})

module.exports = { Image }

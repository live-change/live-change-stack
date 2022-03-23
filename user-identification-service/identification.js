const definition = require('./definition.js')
const config = definition.config

const Image = definition.foreignModel('image', 'Image')

const defaultFields = {
  name: {
    type: String,
    validation: ['nonEmpty']
  },
  image: {
    type: Image
  }
}

const identificationFields = {
  ...(config.ignoreDefaultFields ? {} : defaultFields),
  ...(config.fields)
}

const Identification = definition.model({
  userSessionProperty: {
    ownerReadAccess: () => true,
    ownerWriteAccess: () => true,
    readAccess: () => true
  },
  properties: {
    ...identificationFields
  }
})

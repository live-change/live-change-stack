import definition from './definition.js'
const config = definition.config

const Image = definition.foreignModel('image', 'Image')

const defaultFields = {
  name: {
    type: String,
    //validation: ['nonEmpty']
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
  name: 'Identification',
  sessionOrUserProperty: {
    ownerReadAccess: () => true,
    ownerWriteAccess: () => true,
    readAccess: () => true
  },
  properties: {
    ...identificationFields
  }
})

export { Identification }

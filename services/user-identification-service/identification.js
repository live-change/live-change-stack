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

definition.view({
  name: "identification",
  global: true,
  internal: true,
  properties: {
    sessionOrUserType: {
      type: String,
      validation: ['nonEmpty']
    },
    sessionOrUser: {
      validation: ['nonEmpty']
    }
  },
  returns: {
    type: Object
  },
  async daoPath({ sessionOrUserType, sessionOrUser }, { client, service }) {
    const owner = [sessionOrUserType, sessionOrUser]
    const id = owner.map(p => JSON.stringify(p)).join(':')
    return Identification.path(id)
  }
})

export { Identification }

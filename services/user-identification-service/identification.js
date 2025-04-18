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
    globalView: true,
    ownerReadAccess: () => true,
    ownerWriteAccess: () => true,
    readAccess: () => true
  },
  properties: {
    ...identificationFields
  }
})

definition.trigger({
  name: 'setIdentification',
  properties: {
    sessionOrUserType: {
      type: String,
      validation: ['nonEmpty']
    },
    sessionOrUser: {
      validation: ['nonEmpty']
    },
    overwrite: {
      type: Boolean
    },
    ...identificationFields
  },
  async execute({ sessionOrUserType, sessionOrUser, overwrite, ...identificationData }, { service }, emit) {
    const identification = {}
    for(const field in identificationFields) {
      identification[field] = identificationData[field]
    }
    const id = [sessionOrUserType, sessionOrUser].map(p => JSON.stringify(p)).join(':')
    const currentIdentification = (await Identification.get(id))
    const newIdentification = overwrite
      ? { ...currentIdentification, ...identification }
      : { ...identification, ...currentIdentification }

    console.log("CURRENT IDENTIFICATION", currentIdentification)
    console.log("IDENTIFICATION", identification)
    console.log("UPDATE IDENTIFICATION", id, newIdentification)

    if(currentIdentification) {
      emit({
        type: 'IdentificationUpdated',
        identifiers: { sessionOrUserType, sessionOrUser },
        data: newIdentification
      })
    } else {
      emit({
        type: 'IdentificationSet',
        identifiers: { sessionOrUserType, sessionOrUser },
        data: newIdentification
      })
    }
  }
})

export { Identification }

import definition from './definition.js'

const open = () => true

export const ProfileUnlock = definition.model({
  name: 'ProfileUnlock',
  entity: {
    readAccess: open,
    writeAccess: open,
    createAccess: open,
    updateAccess: open,
    deleteAccess: open
  },
  properties: {
    name: {
      type: String
    }
  }
})

export const Invite = definition.model({
  name: 'Invite',
  entity: {
    readAccess: open,
    writeAccess: open,
    createAccess: open,
    updateAccess: open,
    deleteAccess: open
  },
  properties: {
    name: {
      type: String
    }
  }
})

export const Bonus = definition.model({
  name: 'Bonus',
  entity: {
    readAccess: open,
    writeAccess: open,
    createAccess: open,
    updateAccess: open,
    deleteAccess: open
  },
  properties: {
    name: {
      type: String
    }
  }
})

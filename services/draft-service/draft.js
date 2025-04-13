import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'

const Draft = definition.model({
  name: "Draft",
  sessionOrUserProperty: {
    ownerReadAccess: () => true,
    ownerWriteAccess: () => true,
    extendedWith: ['action', 'target']
  },
  accessControlParents: async (what) => {
    const id = what.object
    console.log("DRAFT ACCESS CONTROL PARENTS", id)
    const data = await modelRuntime().get(id)
    return [{ objectType: data.sessionOrUserType, object: data.sessionOrUser }]
  },
  accessControlParentsSource: [{
    property: 'sessionOrUser',
    possibleTypes: ['Session', 'User']
  }],
  properties: {
    source: { // used for comparison of data that is being edited
      type: Object
    },
    data: {
      type: Object,
      validation: ['nonEmpty']
    },
  },
})

export { Draft }
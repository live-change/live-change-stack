import definition from './definition.js'
import App from '@live-change/framework'
const app = App.app()

import accessModule from './access.js'
const access = accessModule(definition)

definition.view({
  name: "myAccessTo",
  properties: {
    objectType: {
      type: String
    },
    object: {
      type: String
    },
    objects: {
      type: Array,
      of: {
        type: Object,
        properties: {
          objectType: {
            type: String
          },
          object: {
            type: String
          },
        }
      }
    }
  },
  returns: {
    type: Array,
    of: {
      type: String
    }
  },
  async daoPath({ objectType, object, objects }, { client, service }, method) {
    const allObjects = ((objectType && object) ? [{ objectType, object }] : []).concat(objects || [])
    if(allObjects.length == 0) throw 'empty_objects_list'
    return access.accessPath(client, allObjects)
  }
})

definition.view({
  name: "myAccessesTo",
  properties: {
    objects: {
      type: Array,
      of: {
        type: Object,
        properties: {
          objectType: {
            type: String
          },
          object: {
            type: String
          }
        }
      }
    }
  },
  returns: {
    type: Array,
    of: {
      type: String
    }
  },
  async daoPath({ objects }, { client, service }, method) {
    if(objects.length == 0) throw 'empty_objects_list'
    return access.accessesPath(client, objects)
  }
})

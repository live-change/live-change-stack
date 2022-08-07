const definition = require("./definition.js")
const App = require("@live-change/framework")
const app = App.app()

const access = require('./access.js')(definition)

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

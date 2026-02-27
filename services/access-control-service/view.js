import definition from './definition.js'
import App from '@live-change/framework'
const app = App.app()

import accessModule from './access.js'
const access = accessModule(definition)

import { Access, AccessInvitation } from './model.js'

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
      type: Object
    }
  },
  async daoPath({ objectType, object, objects }, { client, service }, method) {
    const allObjects = ((objectType && object) ? [{ objectType, object }] : []).concat(objects || [])
    if(allObjects.length === 0) throw app.logicError("empty_objects_list")
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
    type: Object,
    of: {
      type: String
    }
  },
  async daoPath({ objects }, { client, service }, method) {
    if(objects.length === 0) throw app.logicError("empty_objects_list")
    return access.accessesPath(client, objects)
  }
})

definition.view({
  name: 'myAccessesByObjectType',
  properties: {
    objectType: {
      type: String
    },
    ...App.rangeProperties
  },
  returns: {
    type: Array,
    of: {
      type: Access
    }
  },
  async daoPath(properties, { client, service }, method) {
    const [ sessionOrUserType, sessionOrUser ] =
      client.user ? ['user_User', client.user] : ['session_Session', client.session]
    const { objectType } = properties
    return Access.rangePath([sessionOrUserType, sessionOrUser, objectType], App.extractRange(properties))
  }
})

definition.view({
  name: 'myAccessesByObjectTypeAndRole',
  properties: {
    objectType: {
      type: String
    },
    role: {
      type: String
    },
    ...App.rangeProperties
  },
  returns: {
    type: Array,
    of: {
      type: Access
    }
  },
  async daoPath(properties, { client, service }, method) {
    const [ sessionOrUserType, sessionOrUser ] =
      client.user ? ['user_User', client.user] : ['session_Session', client.session]
    const { objectType, role } = properties
    return Access.indexRangePath('byOwnerRoleAndObject',
      [sessionOrUserType, sessionOrUser, role, objectType], App.extractRange(properties))
  }
})

definition.view({
  name: 'myAccessInvitationsByObjectType',
  properties: {
    objectType: {
      type: String
    },
    ...App.rangeProperties
  },
  returns: {
    type: Array,
    of: {
      type: Access
    }
  },
  async daoPath(properties, { client, service }, method) {
    const [ sessionOrUserType, sessionOrUser ] =
      client.user ? ['user_User', client.user] : ['session_Session', client.session]
    const { objectType } = properties
    return AccessInvitation.rangePath([sessionOrUserType, sessionOrUser, objectType], App.extractRange(properties))
  }
})

definition.view({
  name: 'myAccessInvitationsByObjectTypeAndRole',
  properties: {
    objectType: {
      type: String
    },
    role: {
      type: String
    },
    ...App.rangeProperties
  },
  returns: {
    type: Array,
    of: {
      type: Access
    }
  },
  async daoPath(properties, { client, service }, method) {
    const [ sessionOrUserType, sessionOrUser ] =
      client.user ? ['user_User', client.user] : ['session_Session', client.session]
    const { objectType, role } = properties
    return AccessInvitation.indexRangePath('byOwnerRoleAndObject',
      [sessionOrUserType, sessionOrUser, role, objectType], App.extractRange(properties))
  }
})
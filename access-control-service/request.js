const App = require("@live-change/framework")
const app = App.app()
const definition = require('./definition.js')
const config = definition.config

const { Access, AccessRequest, rolesArrayType } = require('./model.js')
const access = require('./access.js')(definition)

definition.event({
  name: 'accessRequestAccepted',
  async execute({ sessionOrUserType, sessionOrUser, objectType, object, roles }) {
    const id = App.encodeIdentifier([sessionOrUserType, sessionOrUser, objectType, object])
    await Access.create({
      id,
      sessionOrUserType, sessionOrUser, objectType, object, roles
    })
    await AccessRequest.delete(id)
  }
})

definition.action({
  name: 'acceptAccessRequest',
  waitForEvents: true,
  properties: {
    objectType: {
      type: String,
      validation: ['nonEmpty']
    },
    object: {
      type: String,
      validation: ['nonEmpty']
    },
    sessionOrUserType: {
      type: String,
      validation: ['nonEmpty']
    },
    sessionOrUser: {
      type: String,
      validation: ['nonEmpty']
    },
    roles: rolesArrayType
  },
  access: (params, { client, context, visibilityTest }) =>
      visibilityTest || access.clientCanInvite(client, params),
  async execute({ objectType, object, sessionOrUserType, sessionOrUser, roles }, { client, service }, emit) {
    const myRoles = await access.getClientObjectRoles(client, { objectType, object }, true)
    if(!myRoles.includes('administrator')) {
      for(const requestedRole of roles) {
        if(!myRoles.includes(requestedRole)) throw 'notAuthorized'
      }
    }
    const request = App.encodeIdentifier([ sessionOrUserType, sessionOrUser, objectType, object ])
    const requestData = await AccessRequest.get(request)
    if(!requestData) throw 'not_found'
    emit({
      type: 'accessRequestAccepted',
      objectType, object, sessionOrUserType, sessionOrUser, roles
    })
  }
})

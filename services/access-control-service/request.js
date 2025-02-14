import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'
const config = definition.config

import { PublicAccess, Access, AccessRequest, rolesArrayType } from './model.js'
import accessModule from './access.js'
const access = accessModule(definition)

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
  name: 'requestAccess',
  properties: {
    objectType: {
      type: String,
      validation: ['nonEmpty']
    },
    object: {
      type: String,
      validation: ['nonEmpty']
    },
    roles: rolesArrayType
  },
  queuedBy: ['objectType', 'object'],
  waitForEvents: true,
  access: (params, { client, context, visibilityTest }) => true,
  async execute({ objectType, object, roles }, { client, service }, emit) {
    const publicAccess = await PublicAccess.get(App.encodeIdentifier([objectType, object]))
    const [sessionOrUserType, sessionOrUser] =
      client.user ? ['user_User', client.user] : ['session_Session', client.session]

    if(!publicAccess.availableRoles) throw 'notAuthorized'
    for(const requestedRole of roles) {
      if(!publicAccess.availableRoles.includes(requestedRole)) throw 'notAuthorized'
    }

    const request = App.encodeIdentifier([ sessionOrUserType, sessionOrUser, objectType, object ])
    const requestData = await AccessRequest.get(request)
    if(requestData) throw 'already_requested'

    if(publicAccess.autoGrantRequests) {
      emit({
        type: 'accessRequestAccepted',
        objectType, object, sessionOrUserType, sessionOrUser, roles,
        autoAccept: true
      })
      emit({
        type: 'PublicAccessUpdated',
        identifiers: {
          objectType, object
        },
        data: {
          autoGrantRequests: publicAccess.autoGrantRequests - 1
        },
      })
    } else {
      emit({
        type: 'AccessRequestSet',
        data: {
          roles
        },
        identifiers: {
          sessionOrUserType, sessionOrUser,
          objectType, object,
          roles
        }
      })
    }
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
    if(!myRoles.includes('admin')) {
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

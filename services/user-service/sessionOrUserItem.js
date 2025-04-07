import definition from './definition.js'
import App from '@live-change/framework'
import {
  PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition, EventDefinition, TriggerDefinition
} from '@live-change/framework'
import { User, Session } from "./model.js"

import pluralize from 'pluralize'

definition.processor(function(service, app) {

  for(let modelName in service.models) {
    const model = service.models[modelName]
    if(model.sessionOrUserItem) {
      if (model.properties.sessionOrUser) throw new Error('user property already exists!!!')
      const originalModelProperties = { ...model.properties }
      const modelProperties = Object.keys(model.properties)
      const modelPropertyName = modelName.slice(0, 1).toLowerCase() + modelName.slice(1)

      function modelRuntime() {
        return service._runtime.models[modelName]
      }

      const config = model.sessionOrUserItem
      const writeableProperties = modelProperties || config.writableProperties

      //console.log("USER ITEM", model)

      if(model.itemOfAny) throw new Error("model " + modelName + " already have owner")

      const extendedWith = config.extendedWith
          ? (Array.isArray(config.extendedWith) ? config.extendedWith : [config.extendedWith])
          : []
      model.itemOfAny = {
        ...config,
        to: ['sessionOrUser', ...extendedWith]
      }

      service.trigger({
        name: 'signedIn',
        properties: {
          user: {
            type: User,
            validation: ['nonEmpty']
          },
          session: {
            type: Session,
            validation: ['nonEmpty']
          },
        },
        async execute({ user, session }, { service }, emit) {
          const sessionPath = ['session_Session', session]
          const sessionItems = await modelRuntime().indexRangeGet('bySessionOrUser', sessionPath, {} )
          if(config.merge) {
            const userPath = ['user_User', user]
            const userItems = await modelRuntime().indexRangeGet('bySessionOrUser', userPath, {} )
            const mergeResult = await config.merge(sessionItems, userItems)
            if(mergeResult) {
              const { transferred, updated, deleted } = mergeResult
              for(const entity of transferred) {
                emit({
                  type: modelName + 'Transferred',
                  [modelPropertyName]: entity.id,
                  to: {
                    sessionOrUserType: 'user_User',
                    sessionOrUser: user
                  }
                })
              }
              for(const entity of updated) {
                emit({
                  type: modelName + 'Updated',
                  [modelPropertyName]: entity.id,
                  identifiers: {
                    id: entity.id,
                    sessionOrUserType: 'user_User',
                    sessionOrUser: user
                  },
                  data: entity
                })
              }
              for(const entity of deleted) {
                emit({
                  type: modelName + 'Deleted',
                  [modelPropertyName]: entity.id,
                })
              }
            }
          } else {
            for(const entity of sessionItems) {
              emit({
                type: modelName + 'Transferred',
                [modelPropertyName]: entity.id,
                identifiers: {
                  id: entity.id
                },
                to: {
                  sessionOrUserType: 'user_User',
                  sessionOrUser: user
                }
              })
            }
          }
        }
      })

/*      service.trigger({
        name: 'userDeleted',
        properties: {
          user: {
            type: User,
            validation: ['nonEmpty']
          }
        },
        async execute({ user, session }, { service }, emit) {
          /// TODO: delete on userDeleted trigger
        }
      })*/

      if(config.ownerReadAccess) {
        const viewName = 'my' + modelName
        const propertyName = modelName[0].toLowerCase() + modelName.slice(1)
        service.views[viewName] = new ViewDefinition({
          name: viewName,
          access(params, context) {
            return config.ownerReadAccess ? config.ownerReadAccess(params, context) : true
          },
          properties: {
            [propertyName]: {
              type: `${service.name}_${modelName}`,
              validation: ['nonEmpty']
            }
          },
          async daoPath(params, { client, context }) {
            const owner = client.user ? ['user_User', client.user] : ['session_Session', client.session]
            const range = {
              gte: '_'+ params[propertyName],
              lte: '_'+ params[propertyName]
            }
            const path = modelRuntime().indexObjectPath('bySessionOrUser', owner, range )
            //console.log("DAO PATH", path, "range", range, 'params', params, 'result', await app.dao.get(path))
            return path
          }
        })
      }

      if(config.ownerReadAccess) {
        const viewName = 'my' + pluralize(modelName)
        service.views[viewName] = new ViewDefinition({
          name: viewName,
          access(params, context) {
            return config.ownerReadAccess ? config.ownerReadAccess(params, context) : true
          },
          properties: App.rangeProperties,
          daoPath(range, { client, context }) {
            const owner = client.user ? ['user_User', client.user] : ['session_Session', client.session]
            const path = modelRuntime().indexRangePath('bySessionOrUser', owner, range )
            //console.log("DAO PATH", path, "range", range)
            return path
          }
        })
        for(const sortField of config.sortBy || []) {
          const sortFieldUc = sortField.slice(0, 1).toUpperCase() + sortField.slice(1)
          const viewName = 'mySessionOrUser' + pluralize(modelName) + 'By' + sortFieldUc
          service.views[viewName] = new ViewDefinition({
            name: viewName,
            access(params, context) {
              return config.ownerReadAccess(params, context)
            },
            properties: App.rangeProperties,
            daoPath(range, { client, context }) {
              const owner = client.user ? ['user_User', client.user] : ['session_Session', client.session]
              return modelRuntime().sortedIndexRangePath('bySessionOrUser' + sortFieldUc, owner, App.extractRange(range))
            }
          })
        }
      }

      if(config.ownerReadAccess) {
        const viewName = 'my' + modelName
        service.views[viewName] = new ViewDefinition({
          name: viewName,
          async access(params, context) {          
            if(context.visibilityTest) return true
            const data = await modelRuntime().get(params[modelPropertyName])
            if (data.sessionOrUserType === 'user_User') {
              if (data.sessionOrUser !== context.client.user) return false
            } else if (data.sessionOrUserType === 'session_Session') {
              if (data.sessionOrUser !== context.client.session) return false
            }
            return config.userReadAccess ? config.userReadAccess(params, context) : true
          },
          properties: App.rangeProperties,
          daoPath(params, { client, context }) {
            const path = modelRuntime().path(params[modelPropertyName])
            return path
          }
        }) 
      }

      if(config.ownerCreateAccess || config.ownerWriteAccess) {
        const eventName = modelName + 'Created'
        const actionName = 'createMy' + modelName
        service.actions[actionName] = new ActionDefinition({
          name: actionName,
          access: config.ownerCreateAccess || config.ownerWriteAccess,
          properties: {
            ...originalModelProperties,
            [modelPropertyName]: {
              type: model,
              validation: ['localId']
            }
          },
          queuedBy: (command) => command.client.user ? 'u:'+command.client.user : 's:'+command.client.session,
          waitForEvents: true,
          async execute(properties, { client, service }, emit) {
            const id = properties[modelPropertyName] || app.generateUid()
            const entity = await modelRuntime().get(id)
            if(entity) throw 'exists'
            const identifiers = client.user ? {
                  sessionOrUserType: 'user_User',
                  sessionOrUser: client.user,
                } : {
                  sessionOrUserType: 'session_Session',
                  sessionOrUser: client.session,
                }
            emit({
              type: eventName,
              [modelPropertyName]: id,
              identifiers,
              data: properties
            })
            return id
          }
        })
      }
      if(config.ownerUpdateAccess || config.ownerWriteAccess) {
        const eventName = modelName + 'Updated'
        const actionName = 'updateMy' + modelName
        service.actions[actionName] = new ActionDefinition({
          name: actionName,
          access: config.ownerUpdateAccess || config.ownerWriteAccess,
          properties: {
            ...originalModelProperties,
            [modelPropertyName]: {
              type: model,
              validation: ['nonEmpty']
            }
          },
          skipValidation: true,
          queuedBy: (command) => command.client.user ? 'u:'+command.client.user : 's:'+command.client.session,
          waitForEvents: true,
          async execute(properties, { client, service }, emit) {
            const entity = await modelRuntime().get(properties[modelPropertyName])
            if(!entity) throw 'not_found'
            if(entity.sessionOrUserType === 'user_User') {
              if(entity.sessionOrUser !== client.user) throw 'not_authorized'
            }
            if(entity.sessionOrUserType === 'session_Session') {
              if(entity.sessionOrUser !== client.session) throw 'not_authorized'
            }
            let updateObject = {}
            for(const propertyName of writeableProperties) {
              if(properties.hasOwnProperty(propertyName)) {
                updateObject[propertyName] = properties[propertyName]
              }
            }
            const merged = App.utils.mergeDeep({ [modelPropertyName]: properties[modelPropertyName] },
              entity, updateObject)

            await App.validation.validate(merged, validators, { source: action, action, service, app, client })
            const identifiers = client.user ? {
              sessionOrUserType: 'user_User',
              sessionOrUser: client.user,
            } : {
              sessionOrUserType: 'session_Session',
              sessionOrUser: client.session,
            }
            emit({
              type: eventName,
              [modelPropertyName]: entity.id,
              identifiers,
              data: properties
            })
          }
        })
        const action = service.actions[actionName]
        const validators = App.validation.getValidators(action, service, action)
      }
      if(config.userDeleteAccess || config.userWriteAccess) {
        const eventName = 'sessionOrUser' + modelName + 'Deleted'
        const actionName = 'deleteMyUser' + modelName
        service.actions[actionName] = new ActionDefinition({
          name: actionName,
          access: config.userDeleteAccess || config.userWriteAccess,
          properties: {
            [modelPropertyName]: {
              type: model,
              validation: ['nonEmpty']
            }
          },
          queuedBy: (command) => command.client.user ? 'u:'+command.client.user : 's:'+command.client.session,
          waitForEvents: true,
          async execute(properties, { client, service }, emit) {
            const entity = await modelRuntime().get(properties[modelPropertyName])
            if(!entity) throw 'not_found'
            if(entity.sessionOrUserType === 'user_User') {
              if(entity.sessionOrUser !== client.user) throw 'not_authorized'
            }
            if(entity.sessionOrUserType === 'session_Session') {
              if(entity.sessionOrUser !== client.session) throw 'not_authorized'
            }
            const identifiers = client.user ? {
              sessionOrUserType: 'user_User',
              sessionOrUser: client.user,
            } : {
              sessionOrUserType: 'session_Session',
              sessionOrUser: client.session,
            }
            emit({
              type: eventName,
              [modelPropertyName]: entity.id,
              identifiers
            })
          }
        })
      }
    }
  }

})

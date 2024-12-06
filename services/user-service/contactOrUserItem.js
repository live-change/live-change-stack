import definition from './definition.js'
import {
  PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition, EventDefinition
} from '@live-change/framework'
import { User } from "./model.js"

import pluralize from 'pluralize'

definition.processor(function(service, app) {

  for(let modelName in service.models) {
    const model = service.models[modelName]
    if(model.contactOrUserItem) {
      if(model.properties.owner) throw new Error('user property already exists!!!')

      const originalModelProperties = { ...model.properties }
      const modelProperties = Object.keys(model.properties)
      const modelPropertyName = modelName.slice(0, 1).toLowerCase() + modelName.slice(1)

      function modelRuntime() {
        return service._runtime.models[modelName]
      }

      const config = model.contactOrUserItem
      const writeableProperties = modelProperties || config.writableProperties

      //console.log("USER ITEM", model)

      if(model.itemOfAny) throw new Error("model " + modelName + " already have owner")
      model.itemOfAny = {
        ...config
      }

      /*await service.trigger({
        type: 'contactConnected',
        contactType: 'email',
        contact: email,
        user
      })*/

      service.trigger({
        name: 'contactConnected',
        properties: {
          contactType: {
            type: String,
            validation: ['nonEmpty']
          },
          contact: {
            type: String,
            validation: ['nonEmpty']
          },
          user: {
            type: User,
            validation: ['nonEmpty']
          }
        },
        async execute({ contactType, contact, user }, { service }, emit) {
          const contactPath = [contactType, contact]
          const contactItems = await modelRuntime().indexRangeGet('byOwner', contactPath, {} )
          if(config.merge) {
            const userPath = ['user_User', user]
            const userItems = await modelRuntime().indexRangeGet('byOwner', userPath, {} )
            const mergeResult = await config.merge(contactItems, userItems)
            if(mergeResult) {
              const { transferred, updated, deleted } = mergeResult
              for(const entity of transferred) {
                emit({
                  type: modelName + 'Transferred',
                  [modelPropertyName]: entity.id,
                  to: {
                    id: entity.id,
                    ownerType: 'user_User',
                    owner: user
                  }
                })
              }
              for(const entity of updated) {
                emit({
                  type: modelName + 'Updated',
                  [modelPropertyName]: entity.id,
                  identifiers: {
                    id: entity.id,
                    ownerType: 'user_User',
                    owner: user
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
            for(const entity of contactItems) {
              emit({
                type: modelName + 'Transferred',
                [modelPropertyName]: entity.id,
                identifiers: {
                  id: entity.id,
                  ownerType: 'user_User',
                  owner: user
                }
              })
            }
          }
        }
      })

      if(config.ownerReadAccess) {
        const viewName = 'my' + pluralize(modelName)
        service.views[viewName] = new ViewDefinition({
          name: viewName,
          access(params, context) {
            return context.client.user && (config.ownerReadAccess ? config.ownerReadAccess(params, context) : true)
          },
          properties: App.rangeProperties,
          daoPath(range, { client, context }) {
            const owner = ['user_User', client.user]
            const path = modelRuntime().indexRangePath('byOwner', owner, range )
            return path
          }
        })
        for(const sortField of config.sortBy || []) {
          const sortFieldUc = sortField.slice(0, 1).toUpperCase() + sortField.slice(1)
          const viewName = 'mySessionOrUser' + pluralize(modelName) + 'By' + sortFieldUc
          service.views[viewName] = new ViewDefinition({
            name: viewName,
            access(params, context) {
              if(!context.client.user) return false
              return config.ownerReadAccess(params, context)
            },
            properties: App.rangeProperties,
            daoPath(range, { client, context }) {
              const owner = ['user_User', client.user]
              return modelRuntime().sortedIndexRangePath('byOwner' + sortFieldUc, owner, range)
            }
          })
        }
      }

      if(config.ownerCreateAccess || config.ownerWriteAccess) {
        const eventName =  modelName + 'Created'
        const actionName = 'createMy' + modelName
        service.actions[actionName] = new ActionDefinition({
          name: actionName,
          access: (params, context) => context.client.user
              && (config.ownerCreateAccess || config.ownerWriteAccess)(params,context),
          properties: {
            ...originalModelProperties,
            [modelPropertyName]: {
              type: model,
              validation: ['localId']
            }
          },
          queuedBy: (command) => 'u:'+command.client.user,
          waitForEvents: true,
          async execute(properties, { client, service }, emit) {
            const id = properties[modelPropertyName] || app.generateUid()
            const entity = await modelRuntime().get(id)
            if(entity) throw 'exists'
            const identifiers = {
              ownerType: 'user_User',
              owner: client.user,
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
          access: (params, context) => context.client.user
              && (config.ownerUpdateAccess || config.ownerWriteAccess)(params,context),
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
            if(entity.ownerType === 'user_User') {
              if(entity.owner !== client.user) throw 'not_authorized'
            } else throw 'not_authorized'
            let updateObject = {}
            for(const propertyName of writeableProperties) {
              if(properties.hasOwnProperty(propertyName)) {
                updateObject[propertyName] = properties[propertyName]
              }
            }
            const merged = App.utils.mergeDeep({}, entity, updateObject)
            await App.validation.validate(merged, validators, { source: action, action, service, app, client })
            const identifiers = client.user ? {
              ownerType: 'user_User',
              owner: client.user,
            } : {
              ownerType: 'session_Session',
              owner: client.session,
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
        const eventName = modelName + 'Deleted'
        const actionName = 'deleteMyUser' + modelName
        service.actions[actionName] = new ActionDefinition({
          name: actionName,
          access: (params, context) => context.client.user
              && (config.ownerDeleteAccess || config.ownerWriteAccess)(params,context),
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
            if(entity.ownerType === 'user_User') {
              if(entity.owner !== client.user) throw 'not_authorized'
            } else throw 'not_authorized'
            const identifiers = client.user ? {
              ownerType: 'user_User',
              owner: client.user,
            } : {
              ownerType: 'session_Session',
              owner: client.session,
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
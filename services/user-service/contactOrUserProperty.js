import definition from './definition.js'
import App from '@live-change/framework'
import {
  PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition, EventDefinition
} from '@live-change/framework'
import {
  polymorphicPropertyId,
  firePropertySetChange,
  firePropertyUpdateChange,
  firePropertyResetChange,
  firePropertyTransferChange
} from './ownerChangeTriggers.js'
import { User } from "./model.js"
import { allCombinations } from "./combinations.js"
import { createIdentifiersProperties } from './utils.js'

import pluralize from 'pluralize'

definition.processor(function(service, app) {

  for(let modelName in service.models) {
    const model = service.models[modelName]

    if(model.contactOrUserProperty) {
      //console.log("MODEL " + modelName + " IS SESSION OR USER PROPERTY, CONFIG:", model.userProperty)
      if (model.properties.contactOrUser) throw new Error('owner property already exists!!!')

      const originalModelProperties = { ...model.properties }
      const modelProperties = Object.keys(model.properties)

      function modelRuntime() {
        return service._runtime.models[modelName]
      }

      const config = model.contactOrUserProperty
      const writeableProperties = modelProperties || config.writableProperties
      const objectType = service.name + '_' + modelName

      if(model.propertyOf) throw new Error("model " + modelName + " already have owner")
      if(model.propertyOfAny) throw new Error("model " + modelName + " already have owner")

      const extendedWith = config.extendedWith
          ? (Array.isArray(config.extendedWith) ? config.extendedWith : [config.extendedWith])
          : []

      model.propertyOfAny = {        
        to: ['contactOrUser', ...extendedWith],
        ...(definition.config.contactTypes ? {
          contactOrUserTypes: ['user_User'].concat(definition.config.contactTypes
              .map(c => `${c}_${c[0].toUpperCase() + c.slice(1)}`)
            )
        } : {}),
        ...config
      }

      const transferEventName = modelName + 'Transferred'

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
        async execute({ contactType, contact, user }, { service, trigger }, emit) {
          const contactPath = [contactType, contact]
          const contactPropertyId = contactPath.map(p => JSON.stringify(p)).join(':')
          const range = {
            gte: contactPropertyId + '', // '' because it can be not-extended
            lte: contactPropertyId + ':\xFF'
          }
          const contactProperties = await modelRuntime().rangeGet(range)
          /// TODO: list based merge method
          for(const contactProperty of contactProperties) {
            console.log("CONTACT PROPERTY FOUND!", contactProperty, "MERGE =", config.merge)
            const userPath = ['user_User', user]
            for(const key of extendedWith) {
              userPath.push(contactProperty[key+'Type'], contactProperty[key])
            }
            const userPropertyId = userPath.map(p => JSON.stringify(p)).join(':')
            const userProperty = await modelRuntime().get(userPropertyId)
            if(config.merge) {
              const mergeResult = await config.merge(contactProperty, userProperty)
              const userIdentifiers = {
                contactOrUserType: 'user_User',
                contactOrUser: user
              }
              for(const key of extendedWith) {
                userIdentifiers[key+'Type'] = contactProperty[key+'Type']
                userIdentifiers[key] = contactProperty[key]
              }
              if(mergeResult && userProperty) {
                await firePropertyUpdateChange({
                  service, modelName, app, objectType, writeableProperties,
                  id: userPropertyId, identifiers: userIdentifiers,
                  entity: userProperty, data: mergeResult, trigger
                })
                emit({
                  type: modelName + 'Updated',
                  identifiers: {
                    contactOrUserType: 'user_User',
                    contactOrUser: user
                  },
                  data: mergeResult
                })
              } else {
                await firePropertySetChange({
                  service, modelName, app, objectType,
                  id: userPropertyId, identifiers: userIdentifiers,
                  data: mergeResult, trigger
                })
                emit({
                  type: modelName + 'Set',
                  identifiers: {
                    contactOrUserType: 'user_User',
                    contactOrUser: user
                  },
                  data: mergeResult
                })
              }
              const contactIdentifiers = {
                contactOrUserType: contactType,
                contactOrUser: contact
              }
              for(const key of extendedWith) {
                contactIdentifiers[key+'Type'] = contactProperty[key+'Type']
                contactIdentifiers[key] = contactProperty[key]
              }
              const contactId = polymorphicPropertyId(contactIdentifiers, 'contactOrUser', extendedWith)
              await firePropertyResetChange({
                service, modelName, app, objectType, writeableProperties,
                id: contactId, identifiers: contactIdentifiers,
                entity: contactProperty, trigger
              })
              emit({
                type: modelName + 'Reset',
                identifiers: {
                  contactOrUserType: contactType,
                  contactOrUser: contact
                }
              })
            } else {
              if(!userProperty) {
                const extendedIdentifiers = {}
                for(const key of extendedWith) {
                  extendedIdentifiers[key+'Type'] = contactProperty[key+'Type']
                  extendedIdentifiers[key] = contactProperty[key]
                }
                const from = {
                  contactOrUserType: contactType,
                  contactOrUser: contact,
                  ...extendedIdentifiers
                }
                const to = {
                  contactOrUserType: 'user_User',
                  contactOrUser: user,
                  ...extendedIdentifiers
                }
                await firePropertyTransferChange({
                  service, modelName, app, objectType, writeableProperties,
                  fromIdentifiers: from, toIdentifiers: to,
                  sourceEntity: contactProperty,
                  ownerPrefix: 'contactOrUser',
                  extendedWith,
                  trigger
                })
                await service.trigger({ type: modelName + 'Moved' }, { from, to, ...extendedIdentifiers })
                emit({
                  type: transferEventName,
                  from: {
                    contactOrUserType: contactType,
                    contactOrUser: contact,
                    ...extendedIdentifiers
                  },
                  to: {
                    contactOrUserType: 'user_User',
                    contactOrUser: user,
                    ...extendedIdentifiers
                  }
                })
              } // else ignore
            }
          }
        }
      })

      if (!model.ownerCrud) model.ownerCrud = {}

      if(config.ownerReadAccess) { // single item view
        const viewName = 'my' + modelName
        model.ownerCrud.read ??= viewName
        const identifiers = createIdentifiersProperties(extendedWith)
        service.views[viewName] = new ViewDefinition({
          name: viewName,
          properties: {
            ...identifiers
          },
          access(params, context) {
            return context.client.user && (config.ownerReadAccess ? config.ownerReadAccess(params, context) : true)
          },
          daoPath(params, { client, context }) {
            const owner = ['user_User', client.user]
            for(const key of extendedWith) {
              owner.push(params[key+'Type'], params[key])
            }
            const id = owner.map(p => JSON.stringify(p)).join(':')
            return modelRuntime().path(id)
          }
        })
      }

      if(config.ownerReadAccess && config.extendedWith) {
        const extendedCombinations = [[]].concat(allCombinations(extendedWith).slice(0, -1))
        for(const combination of extendedCombinations) {
          const propsUpperCase = combination.map(prop => prop[0].toUpperCase() + prop.slice(1))
          const indexName = 'by' + (combination).map(prop => prop[0].toUpperCase() + prop.slice(1))
          const viewName = 'my' + propsUpperCase.join('And') + pluralize(modelName)
          const identifiers = createIdentifiersProperties(combination)
          service.views[viewName] = new ViewDefinition({
            name: viewName,
            properties: {
              ...identifiers,
              ...App.rangeProperties,
            },
            access(params, context) {
              return context.client.user && (config.ownerReadAccess ? config.ownerReadAccess(params, context) : true)
            },
            daoPath(params, { client, context }) {
              const owner = ['user_User', client.user]
              for (const key of combination) {
                owner.push(params[key + 'Type'], params[key])
              }
              return modelRuntime().indexRangePath(indexName, owner, App.extractRange(params) )
            }
          })
        }
      }

      if(config.ownerViews) {
        for(const view of config.userViews) {
          const viewName = view.name || ('my' + (view.prefix || '') + modelName + (view.suffix || ''))
          service.views[viewName] = new ViewDefinition({
            name: viewName,
            access(params, context) {
              return context.client.user && (view.access ? view.access(params, context) : true)
            },
            daoPath(params, { client, context }) {
              const owner = ['user_User', client.user]
              const id = owner.map(p => JSON.stringify(p)).join(':')
              return view.fields
                ? modelRuntime().limitedPath(id, view.fields)
                : modelRuntime().path(id)
            }
          })
        }
      }

      const eventPrefix = ''

      if(config.ownerSetAccess || config.ownerWriteAccess) {
        const eventName = eventPrefix + modelName + 'Set'
        const actionName = 'setMy' + modelName
        const identifiers = createIdentifiersProperties(extendedWith)
        service.actions[actionName] = new ActionDefinition({
          name: actionName,
          properties: {
            ...identifiers,
            ...originalModelProperties
          },
          access: (params, context) => context.client.user
              && (config.ownerSetAccess || config.ownerWriteAccess)(params, context),
          skipValidation: true,
          queuedBy: (command) => command.client.user ? 'u:'+command.client.user : 's:'+command.client.session,
          waitForEvents: true,
          async execute(properties, { client, service, trigger }, emit) {
            const owner = client.user ? ['user_User', client.user] : ['session_Session', client.session]
            for(const extension of extendedWith) owner.push(properties[extension+'Type'], properties[extension])
            const id = owner.map(p => JSON.stringify(p)).join(':')
            const entity = await modelRuntime().get(id)
            if(entity) throw app.logicError("alerady_exists")
            let newObject = {}
            for(const propertyName of writeableProperties) {
              if(properties.hasOwnProperty(propertyName)) {
                newObject[propertyName] = properties[propertyName]
              }
            }
            const data = App.utils.mergeDeep({},
              App.computeDefaults(model, properties, { client, service } ), newObject)
            const identifiers = {
              contactOrUserType: 'user_User',
              contactOrUser: client.user,
            }
            for(const key of extendedWith) {
              identifiers[key+'Type'] = properties[key+'Type']
              identifiers[key]=properties[key]
            }
            await App.validation.validate({ ...identifiers, ...data }, validators,
              { source: action, action, service, app, client })
            await firePropertySetChange({
              service, modelName, app, objectType, id, identifiers, data, trigger
            })
            emit({
              type: eventName,
              identifiers,
              data
            })
          }
        })
        model.ownerCrud.create ??= actionName
        const action = service.actions[actionName]
        const validators = App.validation.getValidators(action, service, action)
      }

      if(config.ownerUpdateAccess || config.ownerWriteAccess) {
        const eventName = eventPrefix + modelName + 'Updated'
        const actionName = 'updateMy' + modelName
        const identifiers = createIdentifiersProperties(extendedWith)
        service.actions[actionName] = new ActionDefinition({
          name: actionName,
          properties: {
            ...identifiers,
            ...originalModelProperties
          },
          access: (params, context) => context.client.user
              && (config.ownerUpdateAccess || config.ownerWriteAccess)(params, context),
          skipValidation: true,
          queuedBy: (command) => command.client.user ? 'u:'+command.client.user : 's:'+command.client.session,
          waitForEvents: true,
          async execute(properties, { client, service, trigger }, emit) {
            const owner = client.user ? ['user_User', client.user] : ['session_Session', client.session]
            for(const extension of extendedWith) owner.push(properties[extension+'Type'], properties[extension])
            const id = owner.map(p => JSON.stringify(p)).join(':')
            const entity = await modelRuntime().get(id)
            if(!entity) throw app.logicError("not_found")
            let updateObject = {}
            for(const propertyName of writeableProperties) {
              if(properties.hasOwnProperty(propertyName)) {
                updateObject[propertyName] = properties[propertyName]
              }
            }
            const identifiers = {
              contactOrUserType: 'user_User',
              contactOrUser: client.user,
            }
            for(const key of extendedWith) {
              identifiers[key+'Type'] = properties[key+'Type']
              identifiers[key]=properties[key]
            }
            const computedUpdates = App.computeUpdates(model, { ...entity, ...properties }, { client, service })
            const data = App.utils.mergeDeep({}, updateObject, computedUpdates)
            const merged = App.utils.mergeDeep({}, entity, data)
            await App.validation.validate({ ...identifiers, ...merged }, validators,
              { source: action, action, service, app, client })
            await firePropertyUpdateChange({
              service, modelName, app, objectType, writeableProperties,
              id, identifiers, entity, data, trigger
            })
            emit({
              type: eventName,
              identifiers,
              data
            })
          }
        })
        model.ownerCrud.update ??= actionName
        const action = service.actions[actionName]
        const validators = App.validation.getValidators(action, service, action)
      }

      if(config.ownerResetAccess || config.ownerWriteAccess) {
        const eventName = eventPrefix + modelName + 'Reset'
        const actionName = 'resetMy' + modelName
        const identifiers = createIdentifiersProperties(extendedWith)
        service.actions[actionName] = new ActionDefinition({
          name: actionName,
          properties: {
            ...identifiers,
          },
          access: (params, context) => context.client.user
              && (config.ownerResetAccess || config.ownerWriteAccess)(params, context),
          queuedBy: (command) => command.client.user ? 'u:'+command.client.user : 's:'+command.client.session,
          waitForEvents: true,
          async execute(properties, { client, service, trigger }, emit) {
            const owner = client.user ? ['user_User', client.user] : ['session_Session', client.session]
            for(const extension of extendedWith) owner.push(properties[extension+'Type'], properties[extension])
            const id = owner.map(p => JSON.stringify(p)).join(':')
            const entity = await modelRuntime().get(id)
            if (!entity) throw app.logicError("not_found")
            const identifiers = {
              contactOrUserType: 'user_User',
              contactOrUser: client.user,
            }
            for(const key of extendedWith) {
              identifiers[key+'Type'] = properties[key+'Type']
              identifiers[key]=properties[key]
            }
            await firePropertyResetChange({
              service, modelName, app, objectType, writeableProperties,
              id, identifiers, entity, trigger
            })
            emit({
              type: eventName,
              identifiers
            })
          }
        })
        model.ownerCrud.reset ??= actionName
      }

    }
  }

})
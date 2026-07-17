import definition from './definition.js'
import App from '@live-change/framework'
import {
  PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition, EventDefinition
} from '@live-change/framework'
import { fireChangeTriggers, extractObjectData } from '@live-change/relations-plugin'
import {
  polymorphicPropertyId,
  firePropertySetChange,
  firePropertyUpdateChange,
  firePropertyResetChange,
  firePropertyTransferChange
} from './ownerChangeTriggers.js'
import { User, Session } from "./model.js"
import { allCombinations } from "./combinations.js"
import { createIdentifiersProperties } from './utils.js'

import pluralize from 'pluralize'

definition.processor(function(service, app) {

  for(let modelName in service.models) {
    const model = service.models[modelName]

    if(model.sessionOrUserProperty) {
      //console.log("MODEL " + modelName + " IS SESSION OR USER PROPERTY, CONFIG:", model.sessionOrUserProperty)
      if (model.properties.sessionOrUser) throw new Error('sessionOrUser property already exists!!!')

      const originalModelProperties = { ...model.properties }
      const modelProperties = Object.keys(model.properties)

      function modelRuntime() {
        return service._runtime.models[modelName]
      }

      const config = model.sessionOrUserProperty
      const writeableProperties = modelProperties || config.writeableProperties
      const objectType = service.name + '_' + modelName

      if(model.propertyOf) throw new Error("model " + modelName + " already have owner")
      if(model.propertyOfAny) throw new Error("model " + modelName + " already have owner")

      const extendedWith = config.extendedWith
          ? (Array.isArray(config.extendedWith) ? config.extendedWith : [config.extendedWith])
          : []
      model.propertyOfAny = {
        ...config,
        to: ['sessionOrUser', ...extendedWith],
        sessionOrUserTypes: ['session_Session', 'user_User']
      }

      modelProperties.push(...extendedWith.map(p => [p, p+'Type']).flat())

      const transferEventName = modelName + 'Transferred'

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
        async execute({ user, session }, { service, trigger }, emit) {
          const sessionPath = ['session_Session', session]
          const sessionPropertyId = sessionPath.map(p => JSON.stringify(p)).join(':')
          const range = {
            gte: sessionPropertyId + '', // '' because it can be not-extended
            lte: sessionPropertyId + ':\xFF'
          }
          const sessionProperties = await modelRuntime().rangeGet(range)
          for(const sessionProperty of sessionProperties) {
            console.log("SESSION PROPERTY FOUND!", sessionProperty, "MERGE =", config.merge)

            const extendedIdentifiers = {}
            for(const key of extendedWith) {
              extendedIdentifiers[key+'Type'] = sessionProperty[key+'Type']
              extendedIdentifiers[key] = sessionProperty[key]
            }
            const userPath = ['user_User', user]
            for(const key of extendedWith) {
              userPath.push(extendedIdentifiers[key+'Type'], extendedIdentifiers[key])
            }
            const userPropertyId = userPath.map(p => JSON.stringify(p)).join(':')
            const userProperty = await modelRuntime().get(userPropertyId)

            if(config.merge) {
              const mergeResult = await config.merge(sessionProperty, userProperty)
              const userIdentifiers = {
                sessionOrUserType: 'user_User',
                sessionOrUser: user,
                ...extendedIdentifiers
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
                    sessionOrUserType: 'user_User',
                    sessionOrUser: user
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
                    sessionOrUserType: 'user_User',
                    sessionOrUser: user
                  },
                  data: mergeResult
                })
              }
              if(!config.mergeWithoutDelete) {
                const sessionIdentifiers = {
                  sessionOrUserType: 'session_Session',
                  sessionOrUser: session,
                  ...extendedIdentifiers
                }
                const sessionId = polymorphicPropertyId(sessionIdentifiers, 'sessionOrUser', extendedWith)
                await firePropertyResetChange({
                  service, modelName, app, objectType, writeableProperties,
                  id: sessionId, identifiers: sessionIdentifiers,
                  entity: sessionProperty, trigger
                })
                emit({
                  type: modelName + 'Reset',
                  identifiers: {
                    sessionOrUserType: 'session_Session',
                    sessionOrUser: session
                  }
                })
              }
            } else {
              if(!userProperty) {
                const from = {
                  sessionOrUserType: 'session_Session',
                  sessionOrUser: session,
                  ...extendedIdentifiers
                }
                const to = {
                  sessionOrUserType: 'user_User',
                  sessionOrUser: user,
                  ...extendedIdentifiers
                }
                await firePropertyTransferChange({
                  service, modelName, app, objectType, writeableProperties,
                  fromIdentifiers: from, toIdentifiers: to,
                  sourceEntity: sessionProperty,
                  ownerPrefix: 'sessionOrUser',
                  extendedWith,
                  trigger
                })
                await service.trigger({ type: modelName + 'Moved' }, { from, to })
                emit({
                  type: transferEventName,
                  from: {
                    sessionOrUserType: 'session_Session',
                    sessionOrUser: session,
                    ...extendedIdentifiers
                  },
                  to: {
                    sessionOrUserType: 'user_User',
                    sessionOrUser: user,
                    ...extendedIdentifiers
                  }
                })
              } // else ignore - user property is more important by default
            }
          }
        }
      })

/*    not needed
      service.trigger({
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
      })
*/

      if (!model.ownerCrud) model.ownerCrud = {}

      const extendedIdentifiersProperties = createIdentifiersProperties(extendedWith)

      if(config.ownerReadAccess) { // single item view
        const viewName = 'my' + modelName
        model.ownerCrud.read ??= viewName
        service.views[viewName] = new ViewDefinition({
          name: viewName,
          properties: {
            ...extendedIdentifiersProperties
          },
          access(params, context) {
            return config.ownerReadAccess ? config.ownerReadAccess(params, context) : true
          },
          async daoPath(params, { client, context }) {
            const owner = client.user ? ['user_User', client.user] : ['session_Session', client.session]
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
          const indexName = 'by' + (['SessionOrUser', ...combination])
            .map(prop => prop[0].toUpperCase() + prop.slice(1))
          const viewName = 'my' + propsUpperCase.join('And') + pluralize(modelName)
          model.ownerCrud.range ??= viewName
          const identifiers = createIdentifiersProperties(combination)
          service.views[viewName] = new ViewDefinition({
            name: viewName,
            properties: {
              ...identifiers,
              ...App.rangeProperties,
            },
            access(params, context) {
              return config.ownerReadAccess ? config.ownerReadAccess(params, context) : true
            },
            daoPath(params, { client, context }) {
              const owner = client.user ? ['user_User', client.user] : ['session_Session', client.session]
              for (const key of combination) {
                owner.push(params[key + 'Type'], params[key])
              }
              console.log("PATH", modelRuntime().indexRangePath(indexName, owner, App.extractRange(params) ))
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
              return view.access ? view.access(params, context) : true
            },
            daoPath(params, { client, context }) {
              const owner = client.user ? ['user_User', client.user] : ['session_Session', client.session]
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
        service.actions[actionName] = new ActionDefinition({
          name: actionName,
          properties: {
            ...originalModelProperties,
            ...extendedIdentifiersProperties,
          },
          access: config.ownerSetAccess || config.ownerWriteAccess,
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
            await App.validation.validate(data, validators, { source: action, action, service, app, client })
            const identifiers = client.user ? {
              sessionOrUserType: 'user_User',
              sessionOrUser: client.user,
            } : {
              sessionOrUserType: 'session_Session',
              sessionOrUser: client.session,
            }
            for(const key of extendedWith) {
              identifiers[key+'Type'] = properties[key+'Type']
              identifiers[key]=properties[key]
            }
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
        service.actions[actionName] = new ActionDefinition({
          name: actionName,
          properties: {
            ...originalModelProperties,
            ...extendedIdentifiersProperties,
          },
          access: config.ownerUpdateAccess || config.ownerWriteAccess,
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
            const identifiers = client.user ? {
              sessionOrUserType: 'user_User',
              sessionOrUser: client.user,
            } : {
              sessionOrUserType: 'session_Session',
              sessionOrUser: client.session,
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

      if((config.ownerUpdateAccess && config.ownerSetAccess) || config.ownerWriteAccess) {
        const setEventName = eventPrefix + modelName + 'Set'
        const updatedEventName = eventPrefix + modelName + 'Updated'
        const actionName = 'setOrUpdateMy' + modelName
        service.actions[actionName] = new ActionDefinition({
          name: actionName,
          properties: {
            ...originalModelProperties,
            ...extendedIdentifiersProperties,
          },
          access: config.ownerSetAccess || config.ownerWriteAccess,
          skipValidation: true,
          queuedBy: (command) => command.client.user ? 'u:'+command.client.user : 's:'+command.client.session,
          waitForEvents: true,
          async execute(properties, { client, service, trigger }, emit) {
            const owner = client.user ? ['user_User', client.user] : ['session_Session', client.session]
            for(const extension of extendedWith) owner.push(properties[extension+'Type'], properties[extension])
            const id = owner.map(p => JSON.stringify(p)).join(':')
            const entity = await modelRuntime().get(id)
            let updateObject = {}
            for(const propertyName of writeableProperties) {
              if(properties.hasOwnProperty(propertyName)) {
                updateObject[propertyName] = properties[propertyName]
              }
            }
            const identifiers = client.user ? {
              sessionOrUserType: 'user_User',
              sessionOrUser: client.user,
            } : {
              sessionOrUserType: 'session_Session',
              sessionOrUser: client.session,
            }
            for(const key of extendedWith) {
              identifiers[key+'Type'] = properties[key+'Type']
              identifiers[key]=properties[key]
            }
            if(!entity) {
              const data = App.utils.mergeDeep({},
                App.computeDefaults(model, properties, { client, service } ), updateObject)
              await App.validation.validate({ ...identifiers, ...data}, validators,
                  { source: action, action, service, app, client })
              await firePropertySetChange({
                service, modelName, app, objectType, id, identifiers, data, trigger
              })
              emit({
                type: setEventName,
                identifiers,
                data
              })
            } else {
              const computedUpdates = App.computeUpdates(model, { ...entity, ...properties }, { client, service })
              const data = App.utils.mergeDeep({}, updateObject, computedUpdates)
              const merged = App.utils.mergeDeep({}, entity, data)
              await App.validation.validate({ ...identifiers, ...merged}, validators,
                  { source: action, action, service, app, client })
              await firePropertyUpdateChange({
                service, modelName, app, objectType, writeableProperties,
                id, identifiers, entity, data, trigger
              })
              emit({
                type: updatedEventName,
                identifiers,
                data
              })
            }
          }
        })
        model.ownerCrud.createOrUpdate ??= actionName
        const action = service.actions[actionName]
        const validators = App.validation.getValidators(action, service, action)
      }

      if(config.ownerResetAccess || config.ownerWriteAccess) {
        const eventName = eventPrefix + modelName + 'Reset'
        const actionName = 'resetMy' + modelName
        service.actions[actionName] = new ActionDefinition({
          name: actionName,
          access: config.ownerResetAccess || config.ownerWriteAccess,
          queuedBy: (command) => command.client.user ? 'u:'+command.client.user : 's:'+command.client.session,
          waitForEvents: true,
          properties: {
            ...extendedIdentifiersProperties,
          },
          async execute(properties, { client, service, trigger }, emit) {
            const owner = client.user ? ['user_User', client.user] : ['session_Session', client.session]
            for(const extension of extendedWith) owner.push(properties[extension+'Type'], properties[extension])
            const id = owner.map(p => JSON.stringify(p)).join(':')
            const entity = await modelRuntime().get(id)
            if (!entity) throw app.logicError("not_found")
            const identifiers = client.user ? {
              sessionOrUserType: 'user_User',
              sessionOrUser: client.user,
            } : {
              sessionOrUserType: 'session_Session',
              sessionOrUser: client.session,
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

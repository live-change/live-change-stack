const definition = require("./definition.js")
const App = require("@live-change/framework")
const { PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition, EventDefinition } = App
const { User, Session } = require("./model.js")
const { allCombinations } = require("./combinations.js")
const { createIdentifiersProperties } = require('./utils.js')

const pluralize = require('pluralize')


definition.processor(function(service, app) {

  for(let modelName in service.models) {
    const model = service.models[modelName]

    if(model.sessionOrUserProperty) {
      console.log("MODEL " + modelName + " IS SESSION OR USER PROPERTY, CONFIG:", model.sessionOrUserProperty)
      if (model.properties.sessionOrUser) throw new Error('sessionOrUser property already exists!!!')

      const originalModelProperties = { ...model.properties }
      const modelProperties = Object.keys(model.properties)
      const defaults = App.utils.generateDefault(model.properties)

      function modelRuntime() {
        return service._runtime.models[modelName]
      }

      const config = model.sessionOrUserProperty
      const writeableProperties = modelProperties || config.writableProperties

      if(model.propertyOf) throw new Error("model " + modelName + " already have owner")
      if(model.propertyOfAny) throw new Error("model " + modelName + " already have owner")

      const extendedWith = config.extendedWith
          ? (Array.isArray(config.extendedWith) ? config.extendedWith : [config.extendedWith])
          : []
      model.propertyOfAny = {
        ...config,
        to: ['sessionOrUser', ...extendedWith]
      }

      const transferEventName = ['sessionOrUser', ...(extendedWith.map(e => e[0].toUpperCase() + e.slice(1)))]
        .join('And') + 'Owned' + modelName + 'Transferred'

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
              if(mergeResult && userProperty) {
                emit({
                  type: 'sessionOrUserOwned' + modelName + 'Updated',
                  identifiers: {
                    sessionOrUserType: 'user_User',
                    sessionOrUser: user
                  },
                  data: mergeResult
                })
              } else {
                emit({
                  type: 'sessionOrUserOwned' + modelName + 'Set',
                  identifiers: {
                    sessionOrUserType: 'user_User',
                    sessionOrUser: user
                  },
                  data: mergeResult
                })
              }
              if(!config.mergeWithoutDelete) {
                emit({
                  type: 'sessionOrUserOwned' + modelName + 'Reset',
                  identifiers: {
                    sessionOrUserType: 'session_Session',
                    sessionOrUser: session
                  }
                })
              }
            } else {
              if(!userProperty) {
                await service.trigger({
                  type: 'contactOrUserOwned' + modelName + 'Moved',
                  from: {
                    sessionOrUserType: 'session_Session',
                    sessionOrUser: session,
                    ...extendedIdentifiers
                  },
                  to: {
                    sessionOrUserType: 'user_User',
                    sessionOrUser: user,
                    ...extendedIdentifiers
                  },
                })
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

      if(config.ownerReadAccess) { // single item view
        const viewName = 'my' + modelName
        const identifiers = createIdentifiersProperties(extendedWith)
        service.views[viewName] = new ViewDefinition({
          name: viewName,
          properties: {
            ...identifiers
          },
          access(params, context) {
            return config.ownerReadAccess ? config.ownerReadAccess(params, context) : true
          },
          daoPath(params, { client, context }) {
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
              return config.ownerReadAccess ? config.ownerReadAccess(params, context) : true
            },
            daoPath(params, { client, context }) {
              const owner = client.user ? ['user_User', client.user] : ['session_Session', client.session]
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

      const eventPrefix = ['sessionOrUser',
         ...(extendedWith.map(p => p[0].toUpperCase()+p.slice(1)))
      ].join('And') +'Owned'

      if(config.ownerSetAccess || config.ownerWriteAccess) {
        const eventName = eventPrefix + modelName + 'Set'
        const actionName = 'setMy' + modelName
        service.actions[actionName] = new ActionDefinition({
          name: actionName,
          properties: {
            ...originalModelProperties
          },
          access: config.ownerSetAccess || config.ownerWriteAccess,
          skipValidation: true,
          queuedBy: (command) => command.client.user ? 'u:'+command.client.user : 's:'+command.client.session,
          waitForEvents: true,
          async execute(properties, {client, service}, emit) {
            let newObject = {}
            for(const propertyName of writeableProperties) {
              if(properties.hasOwnProperty(propertyName)) {
                newObject[propertyName] = properties[propertyName]
              }
            }
            const data = App.utils.mergeDeep({}, defaults, newObject)
            await App.validation.validate(data, validators, { source: action, action, service, app, client })
            const identifiers = client.user ? {
              sessionOrUserType: 'user_User',
              sessionOrUser: client.user,
            } : {
              sessionOrUserType: 'session_Session',
              sessionOrUser: client.session,
            }
            emit({
              type: eventName,
              identifiers,
              data
            })
          }
        })
        const action = service.actions[actionName]
        const validators = App.validation.getValidators(action, service, action)
      }

      if(config.ownerUpdateAccess || config.ownerWriteAccess) {
        const eventName = eventPrefix + modelName + 'Updated'
        const actionName = 'updateMy' + modelName
        service.actions[actionName] = new ActionDefinition({
          name: actionName,
          properties: {
            ...originalModelProperties
          },
          access: config.ownerUpdateAccess || config.ownerWriteAccess,
          skipValidation: true,
          queuedBy: (command) => command.client.user ? 'u:'+command.client.user : 's:'+command.client.session,
          waitForEvents: true,
          async execute(properties, { client, service }, emit) {
            const owner = client.user ? ['user_User', client.user] : ['session_Session', client.session]
            const id = owner.map(p => JSON.stringify(p)).join(':')
            const entity = await modelRuntime().get(id)
            if(!entity) throw 'not_found'
            let updateObject = {}
            for(const propertyName of writeableProperties) {
              if(properties.hasOwnProperty(propertyName)) {
                updateObject[propertyName] = properties[propertyName]
              }
            }
            const merged = App.utils.mergeDeep({}, entity, updateObject)
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
              identifiers,
              data: properties || {}
            })
          }
        })
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
          async execute(properties, {client, service}, emit) {
            const owner = client.user ? ['user_User', client.user] : ['session_Session', client.session]
            const id = owner.map(p => JSON.stringify(p)).join(':')
            const entity = await modelRuntime().get(id)
            if (!entity) throw 'not_found'
            const identifiers = client.user ? {
              sessionOrUserType: 'user_User',
              sessionOrUser: client.user,
            } : {
              sessionOrUserType: 'session_Session',
              sessionOrUser: client.session,
            }
            emit({
              type: eventName,
              identifiers
            })
          }
        })
      }

    }
  }

})

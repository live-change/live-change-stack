const definition = require("./definition.js")
const App = require("@live-change/framework")
const { PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition, EventDefinition } = App
const { User } = require("./model.js")

definition.processor(function(service, app) {

  for(let modelName in service.models) {
    const model = service.models[modelName]

    if(model.contactOrUserProperty) {
      console.log("MODEL " + modelName + " IS SESSION OR USER PROPERTY, CONFIG:", model.userProperty)
      if (model.properties.owner) throw new Error('owner property already exists!!!')

      const originalModelProperties = { ...model.properties }
      const modelProperties = Object.keys(model.properties)
      const defaults = App.utils.generateDefault(model.properties)

      function modelRuntime() {
        return service._runtime.models[modelName]
      }

      const config = model.contactOrUserProperty
      const writeableProperties = modelProperties || config.writableProperties

      if(model.propertyOfAny) throw new Error("model " + modelName + " already have owner")
      model.propertyOfAny = {
        ...config
      }

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
          const contactPropertyId = contactPath.map(p => JSON.stringify(p)).join(':')
          const contactProperty = await modelRuntime().get(contactPropertyId)
          if(contactProperty) {
            const userPath = ['user_User', user]
            const userPropertyId = userPath.map(p => JSON.stringify(p)).join(':')
            const userProperty = await modelRuntime().get(userPropertyId)
            if(config.merge) {
              const mergeResult = await config.merge(contactProperty, userProperty)
              if(mergeResult && userProperty) {
                emit({
                  type: 'ownerOwned' + modelName + 'Updated',
                  identifiers: {
                    ownerType: 'user_User',
                    owner: user
                  },
                  data: mergeResult
                })
              } else {
                emit({
                  type: 'ownerOwned' + modelName + 'Set',
                  identifiers: {
                    ownerType: 'user_User',
                    owner: user
                  },
                  data: mergeResult
                })
              }
              emit({
                type: 'ownerOwned' + modelName + 'Reset',
                identifiers: {
                  ownerType: contactType,
                  owner: contact
                }
              })
            } else {
              if(!userProperty) {
                emit({
                  type: 'ownerOwned' + modelName + 'Transferred',
                  from: {
                    ownerType: contactType,
                    owner: contact
                  },
                  to: {
                    ownerType: 'user_User',
                    owner: user
                  }
                })
              }
            }
          }
        }
      })

      if(config.ownerReadAccess) {
        const viewName = 'my' + modelName
        service.views[viewName] = new ViewDefinition({
          name: viewName,
          access(params, context) {
            return context.client.user && (config.ownerReadAccess ? config.ownerReadAccess(params, context) : true)
          },
          daoPath(params, { client, context }) {
            const owner = ['user_User', client.user]
            const id = owner.map(p => JSON.stringify(p)).join(':')
            return modelRuntime().path(id)
          }
        })
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

      if(config.ownerSetAccess || config.ownerWriteAccess) {
        const eventName = 'ownerOwned' + modelName + 'Set'
        const actionName = 'setMy' + modelName
        service.actions[actionName] = new ActionDefinition({
          name: actionName,
          properties: {
            ...originalModelProperties
          },
          access: (params, context) => context.client.user
              && (config.ownerSetAccess || config.ownerWriteAccess)(params, context),
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
            const identifiers = {
              ownerType: 'user_User',
              owner: client.user,
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
        const eventName = 'ownerOwned' + modelName + 'Updated'
        const actionName = 'updateMy' + modelName
        service.actions[actionName] = new ActionDefinition({
          name: actionName,
          properties: {
            ...originalModelProperties
          },
          access: (params, context) => context.client.user
              && (config.ownerUpdateAccess || config.ownerWriteAccess)(params, context),
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
            const identifiers = {
              ownerType: 'user_User',
              owner: client.user,
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
        const eventName = 'ownerOwned' + modelName + 'Reset'
        const actionName = 'resetMy' + modelName
        service.actions[actionName] = new ActionDefinition({
          name: actionName,
          access: (params, context) => context.client.user
              && (config.ownerResetAccess || config.ownerWriteAccess)(params, context),
          queuedBy: (command) => command.client.user ? 'u:'+command.client.user : 's:'+command.client.session,
          waitForEvents: true,
          async execute(properties, {client, service}, emit) {
            const owner = client.user ? ['user_User', client.user] : ['session_Session', client.session]
            const id = owner.map(p => JSON.stringify(p)).join(':')
            const entity = await modelRuntime().get(id)
            if (!entity) throw 'not_found'
            const identifiers = {
              ownerType: 'user_User',
              owner: client.user,
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
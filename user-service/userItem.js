const definition = require("./definition.js")
const App = require("@live-change/framework")
const { PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition, EventDefinition } = App
const { User } = require("./model.js")

definition.processor(function(service, app) {

  for(let modelName in service.models) {
    const model = service.models[modelName]
    if(model.userItem) {
      if (model.properties.user) throw new Error('user property already exists!!!')
      const originalModelProperties = {...model.properties}
      const modelProperties = Object.keys(model.properties)
      const defaults = App.utils.generateDefault(model.properties)
      const modelPropertyName = modelName.slice(0, 1).toLowerCase() + modelName.slice(1)

      function modelRuntime() {
        return service._runtime.models[modelName]
      }

      const config = model.userItem
      const writeableProperties = modelProperties || config.writableProperties

      console.log("USER ITEM", model)

      model.itemOf = {
        what: User,
        ...config
      }

      if(config.userReadAccess) {
        const viewName = 'myUser' + modelName + 's'
        service.views[viewName] = new ViewDefinition({
          name: viewName,
          access(params, context) {
            if(!context.client.user) return false
            return config.userReadAccess ? config.userReadAccess(params, context) : true
          },
          properties: App.rangeProperties,
          daoPath(range, { client, context }) {
            const path = modelRuntime().indexRangePath('byUser', [client.user], range )
            return path
          }
        })
        for(const sortField of config.sortBy || []) {
          const sortFieldUc = sortField.slice(0, 1).toUpperCase() + sortField.slice(1)
          const viewName = 'myUser' + modelName + 'sBy' + sortFieldUc
          service.views[viewName] = new ViewDefinition({
            name: viewName,
            access(params, context) {
              if(!context.client.user) return false
              return config.userReadAccess ? config.userReadAccess(params, context) : true
            },
            properties: App.rangeProperties,
            daoPath(range, { client, context }) {
              return modelRuntime().sortedIndexRangePath('byUser' + sortFieldUc, [client.user], range )
            }
          })
        }
      }

      if(config.userCreateAccess || config.userWriteAccess) {
        const eventName = 'userOwned' + modelName + 'Created'
        const actionName = 'createMyUser' + modelName
        service.actions[actionName] = new ActionDefinition({
          name: actionName,
          access: config.userCreateAccess || config.userWriteAccess,
          properties: {
            ...originalModelProperties,
            [modelPropertyName]: {
              type: model,
              validation: ['localId']
            }
          },
          //queuedBy: (command) => command.client.user,
          waitForEvents: true,
          async execute(properties, { client, service }, emit) {
            const id = properties[modelPropertyName] || app.generateUid()
            const entity = await modelRuntime().get(id)
            if(entity) throw 'exists'
            emit({
              type: eventName,
              [modelPropertyName]: id,
              identifiers: {
                user: client.user,
              },
              data: properties
            })
            return id
          }
        })
      }
      if(config.userUpdateAccess || config.userWriteAccess) {
        const eventName = 'userOwned' + modelName + 'Updated'
        const actionName = 'updateMyUser' + modelName
        service.actions[actionName] = new ActionDefinition({
          name: actionName,
          access: config.userUpdateAccess || config.userWriteAccess,
          properties: {
            ...originalModelProperties,
            [modelPropertyName]: {
              type: model,
              validation: ['nonEmpty']
            }
          },
          skipValidation: true,
          queuedBy: (command) => command.client.user,
          waitForEvents: true,
          async execute(properties, { client, service }, emit) {
            const entity = await modelRuntime().get(properties[modelPropertyName])
            if(!entity) throw 'not_found'
            if(entity.user != client.user) throw 'not_authorized'
            let updateObject = {}
            for(const propertyName of writeableProperties) {
              if(properties.hasOwnProperty(propertyName)) {
                updateObject[propertyName] = properties[propertyName]
              }
            }
            const merged = App.utils.mergeDeep({}, entity, updateObject)
            await App.validation.validate(merged, validators, { source: action, action, service, app, client })
            emit({
              type: eventName,
              [modelPropertyName]: entity.id,
              identifiers: {
                user: client.user,
              },
              data: properties
            })
          }
        })
        const action = service.actions[actionName]
        const validators = App.validation.getValidators(action, service, action)
      }
      if(config.userDeleteAccess || config.userWriteAccess) {
        const eventName = 'userOwned' + modelName + 'Deleted'
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
          queuedBy: (command) => command.client.user,
          waitForEvents: true,
          async execute(properties, { client, service }, emit) {
            const entity = await modelRuntime().get(properties[modelPropertyName])
            if(!entity) throw 'not_found'
            if(entity.user != client.user) throw 'not_authorized'
            emit({
              type: eventName,
              [modelPropertyName]: entity.id,
              identifiers: {
                user: client.user
              }
            })
          }
        })
      }
    }
  }

})
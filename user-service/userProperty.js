const definition = require("./definition.js")
const App = require("@live-change/framework")
const { PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition, EventDefinition } = App
const { User } = require("./model.js")

definition.processor(function(service, app) {

  for(let modelName in service.models) {
    const model = service.models[modelName]

    if(model.userProperty) {
      console.log("MODEL " + modelName + " IS USER PROPERTY, CONFIG:", model.userProperty)
      if (model.properties.user) throw new Error('user property already exists!!!')

      const originalModelProperties = { ...model.properties }
      const modelProperties = Object.keys(model.properties)
      const defaults = App.utils.generateDefault(model.properties)

      function modelRuntime() {
        return service._runtime.models[modelName]
      }

      const config = model.userProperty
      const writeableProperties = modelProperties || config.writableProperties

      model.propertyOf = {
        what: User,
        ...config
      }

      if(config.userReadAccess) {
        const viewName = 'myUser' + modelName
        service.views[viewName] = new ViewDefinition({
          name: viewName,
          access: config.userReadAccess,
          daoPath(params, { client, context }) {
            return modelRuntime().path(client.user)
          }
        })
      }

      if(config.userSetAccess || config.userWriteAccess) {
        const eventName = 'userOwned' + modelName + 'Set'
        const actionName = 'setMyUser' + modelName
        service.actions[actionName] = new ActionDefinition({
          name: actionName,
          properties: {
            ...originalModelProperties
          },
          access: config.userSetAccess || config.userWriteAccess,
          skipValidation: true,
          queuedBy: (command) => command.client.user,
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
            emit({
              type: eventName,
              identifiers: {
                user: client.user
              },
              data
            })
          }
        })
        const action = service.actions[actionName]
        const validators = App.validation.getValidators(action, service, action)
      }

      if(config.userUpdateAccess || config.userWriteAccess) {
        const eventName = 'userOwned' + modelName + 'Updated'
        const actionName = 'updateMyuser' + modelName
        service.actions[actionName] = new ActionDefinition({
          name: actionName,
          properties: {
            ...originalModelProperties
          },
          access: config.userUpdateAccess || config.userWriteAccess,
          skipValidation: true,
          queuedBy: (command) => command.client.user,
          waitForEvents: true,
          async execute(properties, { client, service }, emit) {
            const entity = await modelRuntime().get(client.user)
            if(!entity) throw 'not_found'
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
              identifiers: {
                user: client.user
              },
              data: properties || {}
            })
          }
        })
        const action = service.actions[actionName]
        const validators = App.validation.getValidators(action, service, action)
      }

      if(config.userResetAccess || config.userWriteAccess) {
        const eventName = 'userOwned' + modelName + 'Reset'
        const actionName = 'resetMyuser' + modelName
        service.actions[actionName] = new ActionDefinition({
          name: actionName,
          access: config.userResetAccess || config.userWriteAccess,
          queuedBy: (command) => command.client.user,
          waitForEvents: true,
          async execute(properties, {client, service}, emit) {
            const entity = await modelRuntime().indexObjectGet('byuser', client.user)
            if (!entity) throw 'not_found'
            emit({
              type: eventName,
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
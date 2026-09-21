import definition from './definition.js'
import App from '@live-change/framework'
const app = App.app()

import accessModule from './access.js'
const access = accessModule(definition)

import { wrapViewObservable } from './wrapViewObservable.js'

definition.processor({
  priority: -1,
  process(service, app) {

    for(const actionName in service.actions) {
      const action = service.actions[actionName]
      if(!action.accessControl) continue
      const config = action.accessControl
      if(config.public) continue

      //console.log("ACCESS CONTROL", service.name, "ACTION", action.name)

      const oldExec = action.execute
      action.execute = async (...args) => {        
        const [ properties, context, emit ] = args
        const { client } = context
      
        const { objectType, object } = properties
        const objects = [].concat(
          config.objects ? config.objects(properties) :
            ((objectType && object) ? [{ objectType, object }] : [])
        )

        if(objects.length === 0) {
          console.warn('no objects for ' + service.name + ' action ' + action.name + ' access control to work - only global roles will be checked')
        }
        const accessible = await access.clientHasAccessRoles(client, { objects }, config.roles)

        /* console.log("ACTION", service.name, action.name, "ACCESS CONTROL TO",
          objects, 'CLIENT', client, 'CONFIG', config, "ACCESSIBLE", accessible) */

        if(!accessible) throw app.logicError("notAuthorized")

        return oldExec.apply(action, args)
      }
    }

    for(const viewName in service.views) {
      const view = service.views[viewName]
      if(!view.accessControl) continue
      const config = view.accessControl

      //console.log("ACCESS CONTROL", service.name, "VIEW", view.name, "CONFIG", config)

      const oldGet = view.get
      const oldObservable = view.observable
      view.get = async (...args) => {
        const [ properties, context ] = args
        const { client } = context
        const { objectType, object } = properties
        const objects = [].concat(
          config.objects ? config.objects(properties) :
            ((objectType && object) ? [{ objectType, object }] : [])
        )
        if(objects.length === 0) {
          throw new Error('no objects for access control to work in view ' + viewName)
        }
        /* console.log("ACCESS CONTROL", service.name, "VIEW", view.name, "CONFIG", config)
        console.log("OBJECTS", objects)
        console.log("CLIENT", client)
        console.log("ROLES", config.roles) */
        const accessible = await access.clientHasAccessRoles(client, { objects }, config.roles)
        //console.log("ACCESSIBLE", accessible)
        if(!accessible) throw app.logicError("notAuthorized")
        return oldGet.apply(view, args)
      }
      view.observable = wrapViewObservable({
        access,
        app,
        oldObservable,
        view,
        config,
        viewName: service.name + ' view ' + viewName
      })
    }

  }
})

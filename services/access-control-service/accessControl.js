import definition from './definition.js'
import App from '@live-change/framework'
import { ObservableValue, ObservableList, ObservableProxy, ObservablePromiseProxy } from '@live-change/dao'
const app = App.app()

import accessModule from './access.js'
const access = accessModule(definition)

definition.processor({
  priority: -1,
  process(service, app) {

    for(const actionName in service.actions) {
      const action = service.actions[actionName]
      if(!action.accessControl) continue
      const config = action.accessControl

      console.log("ACCESS CONTROL", service.name, "ACTION", action.name)

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
          throw new Error('no objects for access control to work')
        }
        const accessible = access.clientHasAccessRoles(client, { objects }, config.roles)
        if(!accessible) throw 'notAuthorized'

        return oldExec.apply(action, args)
      }
    }

    for(const viewName in service.views) {
      const view = service.views[viewName]
      if(!view.accessControl) continue
      const config = view.accessControl

      console.log("ACCESS CONTROL", service.name, "VIEW", view.name)

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
        console.log("OBJECTS", objects)
        /*console.log("CLIENT", client)
        console.log("ROLES", config.roles)*/
        const accessible = await access.clientHasAccessRoles(client, { objects }, config.roles)
        if(!accessible) throw 'notAuthorized'
        return oldGet.apply(view, args)
      }
      view.observable = (...args) => {
        const [ properties, context ] = args
        const { client } = context
        const { objectType, object } = properties
        const objects = [].concat(
          config.objects ? config.objects(properties) :
            ((objectType && object) ? [{ objectType, object }] : [])
        )
        if(objects.length === 0) {
          throw new Error('no objects for access control to work')
        }

        const rolesPath = access.accessPath(client, objects)

        const errorObservable = new ObservableValue()
        errorObservable.handleError('notAuthorized')

        const observableProxy = new ObservableProxy(null)

        let valueObservable

        let accessible
        const rolesObservable = app.dao.observable(rolesPath)
        const rolesObserver = (signal, value) => {
          const accessObject = rolesObservable.getValue()
          const newAccessible = accessObject ? access.testRoles(config.roles, accessObject.roles) : false
          if(newAccessible !== accessible) {
            if(newAccessible === true /*&& !valueObservable*/) {
              valueObservable = oldObservable.apply(view, args)
              if(valueObservable.then) {
                valueObservable = new ObservablePromiseProxy(valueObservable)
              }
            }
            observableProxy.setTarget(newAccessible ? valueObservable : errorObservable)
            accessible = newAccessible
          }
        }
        rolesObservable.observe(rolesObserver)

        const oldDispose = observableProxy.dispose
        const oldRespawn = observableProxy.respawn
        observableProxy.dispose = () => {
          rolesObservable.unobserve(rolesObserver)
          oldDispose.apply(observableProxy)
        }
        observableProxy.respawn = () => {
          rolesObservable.observe(rolesObserver)
          oldRespawn.apply(observableProxy)
        }
        return observableProxy
      }
    }

  }
})

import { getValidators, validate } from '../utils/validation.js'

export default function(service, app) {
  for(let actionName in service.actions) {
    const action = service.actions[actionName]
    if(action.skipValidation) continue
    const validators = getValidators(action, service, action)
    if(Object.keys(validators).length > 0) {
      const oldExec = action.execute
      action.execute = async (...args) => {
        const context = args[1]
        return validate(args[0], validators, { source: action, action, service, app, ...context }).then(() =>
          oldExec.apply(action, args)
        )
      }
    }
  }
  for(let viewName in service.views) {
    const view = service.views[viewName]
    if(view.skipValidation) continue
    const validators = getValidators(view, service, view)
    if(Object.keys(validators).length > 0) {
      if (view.observable) {
        const oldObservable = view.observable
        view.observable = async (...args) => {
          const context = args[1]
          return validate(args[0], validators, { source: view, view, service, app, ...context }).then(() =>
              oldObservable.apply(view, args)
          )
        }
      }
      if(view.get) {
        const oldGet = view.get
        view.get = async (...args) => {
          const context = args[1]
          return validate(args[0], validators, { source: view, view, service, app, ...context }).then(() =>
              oldGet.apply(view, args)
          )
        }
      }
    }
  }
}

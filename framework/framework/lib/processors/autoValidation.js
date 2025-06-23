import { getValidators, validate } from '../utils/validation.js'

export default function(service, app) {
  for(let actionName in service.actions) {
    const action = service.actions[actionName]
    if(action.skipValidation && !action.validation) continue
    const validators = getValidators(action, service, action)
    if(Object.keys(validators).length > 0) {
      const oldExec = action.execute
      action.execute = async (...args) => {
        const context = args[1]
        if(args[0]._validationOnly) {
          if(!action.skipValidation) {
            await validate(args[0], validators, { source: action, action, service, app, ...context })
          }
          if(action.validation === true) {
            return await oldExec.apply(action, args) // validate inside execute
          } else if(typeof action.validation === 'function') {
            const result = await action.validation(args[0], { source: action, action, service, app, ...context })
            if(result) throw result
            return 'ok'
          }
        } else {
          if(!action.skipValidation) {
            await validate(args[0], validators, { source: action, action, service, app, ...context })
          }
          if(typeof action.validation === 'function') {
            const result = await action.validation(args[0], { source: action, action, service, app, ...context })
            if(result) throw result            
          }
          return oldExec.apply(action, args)
        }
      }
    }
  }
  for(let viewName in service.views) {
    const view = service.views[viewName]
    if(view.skipValidation && !view.validation) continue
    const validators = getValidators(view, service, view)
    if(Object.keys(validators).length > 0) {
      if (view.observable) {
        const oldObservable = view.observable
        view.observable = async (...args) => {
          const context = args[1]
          if(!view.skipValidation) {
            await validate(args[0], validators, { source: view, view, service, app, ...context })
          }
          if(typeof view.validation === 'function') {
            const result = await view.validation(args[0], { source: view, view, service, app, ...context })
            if(result) throw result            
          }
          return oldObservable.apply(view, args)
        }
      }
      if(view.get) {
        const oldGet = view.get
        view.get = async (...args) => {
          const context = args[1]
          if(!view.skipValidation) {
            await validate(args[0], validators, { source: view, view, service, app, ...context })
          }
          if(typeof view.validation === 'function') {
            const result = await view.validation(args[0], { source: view, view, service, app, ...context })
            if(result) throw result            
          }
          return oldGet.apply(view, args)          
        }
      }
    }
  }
  for(let triggerName in service.triggers) {
    const triggers = service.triggers[triggerName]
    for(let trigger of triggers) {
      if(trigger.skipValidation && !trigger.validation) continue
      const validators = getValidators(trigger, service, trigger)
      if(Object.keys(validators).length > 0) {
        //console.log("T VALIDATION", trigger.name, validators)
        const oldExecute = trigger.execute
        trigger.execute = async (...args) => {
         // console.log("VALIDATION", trigger.name)
          const context = args[1]
          if(!trigger.skipValidation) {
            await validate(args[0], validators, { source: trigger, trigger, service, app, ...context })
          }
          if(typeof trigger.validation === 'function') {
            const result = await trigger.validation(args[0], { source: trigger, trigger, service, app, ...context })
            if(result) throw result            
          }
          return oldExecute.apply(trigger, args)
        }
      }
    }
  }
}

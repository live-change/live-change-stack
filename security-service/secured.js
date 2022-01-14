const definition = require('./definition.js')
const { getClientKeysObject, getClientKeysStrings, multiKeyIndexQuery } = require('./utils.js')

definition.processor(function(service, app) {

  for(let actionName in service.actions) {
    const action = service.actions[actionName]
    if(!action.secured) continue
    const config = action.secured

    console.log("SECURED", service.name, action.name)

    const oldExec = action.execute
    action.execute = async (...args) => {
      const [ properties, context, emit ] = args
      const { client } = context
      oldExec.apply(action, args)
    }

    /// TODO: detect bans, block actions
    /// TODO: detect associated events
    /// TODO: report security violation if succeded
    /// TODO: report security violation if failed - another event
    /// TODO: additional validation based on ban type(captcha)
    /// TODO: additional delay based on ban type
  }

  for(let triggerName in service.actions) {
    const trigger = service.actions[triggerName]
    if(!trigger.secured) continue
    const config = trigger.secured

    console.log("SECURED TRIGGER", service.name, trigger.name)

    const oldExec = trigger.execute
    trigger.execute = async (...args) => {
      const [ properties, context, emit ] = args
      const { client, ...otherProperties } = properties
      oldExec.apply(trigger, args)
    }

    /// TODO: detect bans, block triggers
    /// TODO: detect associated events
    /// TODO: report security violation if succeded
    /// TODO: report security violation if failed - another event
    /// TODO: additional validation based on ban type(captcha)
    /// TODO: additional delay based on ban type
  }

})

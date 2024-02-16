import definition from './definition.js'
import {
  getClientKeysObject, getClientKeysStrings, multiKeyIndexQuery, fastMultiKeyIndexQuery
} from './utils.js'
import { Ban } from './ban.js'

async function getBans(client, actions) {
  const keys = []
  for(const action of actions) {
    keys.push(...getClientKeysStrings(client, action + ':'))
  }
  const bans = fastMultiKeyIndexQuery(keys, 'security_Ban_actionBans', Ban.tableName)
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

definition.processor(function(service, app) {

  for(let actionName in service.actions) {
    const action = service.actions[actionName]
    if(!action.secured) continue
    const config = action.secured
    const actions = config.actions || actionName

    console.log("SECURED ACTION", service.name, action.name)

    const oldExec = action.execute
    action.execute = async (...args) => {
      const [ properties, context, emit ] = args
      const { client } = context
      const bans = await getBans(client, actions)

      if(bans.find(ban => ban.type == 'block')) {
        /// TODO: report security violation if failed
        throw 'securityBlock'
      }

      if(bans.find(ban => ban.type == 'delay')) {
        await sleep(3000)
      }

      /// TODO: additional delay based on ban type

      /// TODO: report security violation if succeded - another event

      /// TODO: additional validation based on ban type(captcha)

      return oldExec.apply(action, args)
    }
  }

  for(let triggerName in service.actions) {
    const trigger = service.actions[triggerName]
    if(!trigger.secured) continue
    const config = trigger.secured
    const actions = config.actions || triggerName

    console.log("SECURED TRIGGER", service.name, trigger.name)

    const oldExec = trigger.execute
    trigger.execute = async (...args) => {
      const [ properties, context, emit ] = args
      const { client, ...otherProperties } = properties
      const bans = await getBans(client, actions)

      if(bans.find(ban => ban.type == 'block')) throw 'securityBlock'

      if(bans.find(ban => ban.type == 'block')) {
        /// TODO: report security violation if failed
        throw 'securityBlock'
      }

      if(bans.find(ban => ban.type == 'delay')) {
        await sleep(3000)
      }

      /// TODO: additional delay based on ban type

      /// TODO: report security violation if succeded - another event

      /// TODO: additional validation based on ban type(captcha)

      return oldExec.apply(trigger, args)
    }
  }

})

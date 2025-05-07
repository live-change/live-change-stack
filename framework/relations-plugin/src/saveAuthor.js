import {
  PropertyDefinition
} from "@live-change/framework"

export function defineAuthorProperties() {
  return {
    authorType: new PropertyDefinition({
      type: String,
      validation: ['nonEmpty'],
      default: (_props, context) => context.client.user ? 'user_User' : 'session_Session'
    }),
    author: new PropertyDefinition({
      type: String,
      validation: ['nonEmpty'],
      default: (_props, context) => context.client.user ? context.client.user : context.client.session
    })
  }
}

export function defineUpdaterProperties() {
  return {
    updaterType: new PropertyDefinition({
      type: String,
      validation: ['nonEmpty'],
      updated: (_props, context) => context.client.user ? 'user_User' : 'session_Session'
    }),
    updater: new PropertyDefinition({
      type: String,
      validation: ['nonEmpty'],
      updated: (_props, context) => context.client.user ? context.client.user : context.client.session
    })
  }
}

export default function(service, app) {
  for(let modelName in service.models) {
    const model = service.models[modelName]
    if(model.saveAuthor) {
      model.properties = {
        ...model.properties,
        ...defineAuthorProperties()
      }
    }
    if(model.saveUpdater) {
      model.properties = {
        ...model.properties,
        ...defineUpdaterProperties()
      }
    }
  }
}
import {
  defineProperties, defineIndexes,
  processModelsAnnotation, generateId, addAccessControlParents,
  defineDeleteByOwnerEvents, defineParentDeleteTriggers,
  defineGlobalRangeView,
  RelationConfig
} from './utils.js'

import { defineSetEvent, defineUpdatedEvent, defineTransferredEvent, defineResetEvent } from './propertyEvents.js'

import {
  defineObjectView,
  defineRangeViews,
  defineSetAction,
  defineUpdateAction,
  defineSetOrUpdateAction,
  defineResetAction,
  defineSetTrigger,
  defineUpdateTrigger,
  defineSetOrUpdateTrigger,
  defineResetTrigger,
  defineDeleteTrigger,
  defineDeleteAction
} from './singularRelationUtils.js'
import { AccessSpecification } from '@live-change/framework'
import { AccessControlSettings } from './types.js'

export interface PropertyOfConfig extends RelationConfig {
  readAccess?: AccessSpecification
  writeAccess?: AccessSpecification
  listAccess?: AccessSpecification
  setAccess?: AccessSpecification
  updateAccess?: AccessSpecification
  setOrUpdateAccess?: AccessSpecification
  resetAccess?: AccessSpecification
  readAllAccess?: AccessSpecification
  singleAccess?: AccessSpecification
  singleAccessControl?: AccessControlSettings

  readAccessControl?: AccessControlSettings
  writeAccessControl?: AccessControlSettings
  listAccessControl?: AccessControlSettings
  setAccessControl?: AccessControlSettings
  updateAccessControl?: AccessControlSettings
  resetAccessControl?: AccessControlSettings
  setOrUpdateAccessControl?: AccessControlSettings
  views?: {
    type: 'range' | 'object'
    internal?: boolean
    readAccess?: AccessSpecification,
    readAccessControl?: AccessControlSettings,
    fields?: string[]
  }[]
}
  
export default function(service, app) {
  processModelsAnnotation<PropertyOfConfig>(service, app, 'propertyOf', false, (config, context) => {

    context.relationWord = 'Property'
    context.reverseRelationWord = 'Owned'
    context.partialReverseRelationWord = 'Owned'

    context.sameIdAsParent = true

    context.identifiers = defineProperties(context.model, context.others, context.otherPropertyNames)
    context.model.identifiers = [
      ...Object.keys(context.identifiers).map(name => ({ name, field: name })), 
      { name: context.modelPropertyName, field: 'id' }
    ]

    addAccessControlParents(context)
    defineIndexes(context.model, context.otherPropertyNames, context.others)

    defineObjectView({ ...config }, context,
      !!(
        config.singleAccess || config.singleAccessControl
         || config.readAccess || config.readAccessControl 
         || config.writeAccess || config.writeAccessControl))
    defineRangeViews(config, context,
      !!(config.listAccess || config.readAccess || config.listAccessControl))

    if(config.views) {
      for(const view of config.views) {
        if(view.type !== 'range') {
          defineObjectView({ ...config, ...view }, context, !view.internal)
        } else {
          defineRangeViews({ ...config, ...view }, context, !view.internal)
        }
      }
    }

    defineGlobalRangeView(config, context, !!config.readAllAccess)

    defineSetEvent(config, context, generateId)
    defineUpdatedEvent(config, context, generateId)
    defineTransferredEvent(config, context, generateId)
    defineResetEvent(config, context, generateId)
    defineDeleteByOwnerEvents(config, context)

    defineSetTrigger(config, context)
    defineUpdateTrigger(config, context)
    defineSetOrUpdateTrigger(config, context)
    defineResetTrigger(config, context)
    defineDeleteTrigger(config, context)

    if(config.setAccess || config.writeAccess || config.setAccessControl || config.writeAccessControl) {
      defineSetAction(config, context)
    }

    if(config.updateAccess || config.writeAccess || config.updateAccessControl || config.writeAccessControl) {
      defineUpdateAction(config, context)
    }

    if((config.setAccess && config.updateAccess && config.setOrUpdateAccess) || config.writeAccess
      || config.setOrUpdateAccessControl || config.writeAccessControl) {
      defineSetOrUpdateAction(config, context)
    }

    if(config.resetAccess || config.writeAccess || config.resetAccessControl || config.writeAccessControl) {
      defineResetAction(config, context)
      defineDeleteAction(config, context)
    }

    if(!config.customDeleteTrigger) defineParentDeleteTriggers(config, context)
  })
}

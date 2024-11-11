import {
  defineProperties, defineIndexes,
  processModelsAnnotation, generateId, addAccessControlParents,
  defineDeleteByOwnerEvents, defineParentDeleteTriggers
} from './utils.js'

import { defineSetEvent, defineUpdatedEvent, defineTransferredEvent, defineResetEvent } from './propertyEvents.js'

import {
  defineView,
  defineSetAction, defineUpdateAction, defineSetOrUpdateAction, defineResetAction,
  defineSetTrigger, defineUpdateTrigger, defineSetOrUpdateTrigger, defineResetTrigger
} from './singularRelationUtils.js'

export default function(service, app) {
  processModelsAnnotation(service, app, 'propertyOf', false, (config, context) => {

    context.relationWord = 'Property'
    context.reverseRelationWord = 'Owned'

    context.sameIdAsParent = true

    context.identifiers = defineProperties(context.model, context.others, context.otherPropertyNames)
    context.model.identifiers = Object.keys(context.identifiers)

    addAccessControlParents(context)
    defineIndexes(context.model, context.otherPropertyNames, context.others)

    defineView({ ...config }, context,
      config.readAccess || config.writeAccess || config.readAccessControl || config.writeAccessControl)
    if(config.views) {
      for(const view of config.views) {
        defineView({ ...config, ...view }, context, !view.internal)
      }
    }

    defineSetEvent(config, context, generateId)
    defineUpdatedEvent(config, context, generateId)
    defineTransferredEvent(config, context, generateId)
    defineResetEvent(config, context, generateId)
    defineDeleteByOwnerEvents(config, context)

    defineSetTrigger(config, context)
    defineUpdateTrigger(config, context)
    defineSetOrUpdateTrigger(config, context)
    defineResetTrigger(config, context)

    if(config.setAccess || config.writeAccess || config.setAccessControl || config.writeAccessControl) {
      defineSetAction(config, context)
    }

    if(config.updateAccess || config.writeAccess || config.updateAccessControl || config.writeAccessControl) {
      defineUpdateAction(config, context)
    }

    if((config.setAccess && config.updateAccess) || config.writeAccess
      || config.setOrUpdateAccessControl || config.writeAccessControl) {
      defineSetOrUpdateAction(config, context)
    }

    if(config.resetAccess || config.writeAccess || config.resetAccessControl || config.writeAccessControl) {
      defineResetAction(config, context);
    }

    if(!config.customDeleteTrigger) defineParentDeleteTriggers(config, context)
  })
}

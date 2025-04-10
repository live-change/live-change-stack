import {
  defineProperties, defineIndexes,
  processModelsAnnotation, generateId, addAccessControlParents,
  defineDeleteByOwnerEvents, defineParentDeleteTriggers,
  defineGlobalRangeView
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

export default function(service, app) {
  processModelsAnnotation(service, app, 'propertyOf', false, (config, context) => {

    context.relationWord = 'Property'
    context.reverseRelationWord = 'Owned'
    context.partialReverseRelationWord = 'Owned'

    context.sameIdAsParent = true

    context.identifiers = defineProperties(context.model, context.others, context.otherPropertyNames)
    context.model.identifiers = Object.keys(context.identifiers)

    addAccessControlParents(context)
    defineIndexes(context.model, context.otherPropertyNames, context.others)

    defineObjectView({ ...config }, context,
      config.readAccess || config.writeAccess || config.readAccessControl || config.writeAccessControl)
    defineRangeViews(config, context,
      config.listAccess || config.readAccess || config.listAccessControl
    )

    if(config.views) {
      for(const view of config.views) {
        if(view.type !== 'range') {
          defineObjectView({ ...config, ...view }, context, !view.internal)
        } else {
          defineRangeViews({ ...config, ...view }, context, !view.internal)
        }
      }
    }

    defineGlobalRangeView(config, context, config.readAllAccess)


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

    if((config.setAccess && config.updateAccess) || config.writeAccess
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

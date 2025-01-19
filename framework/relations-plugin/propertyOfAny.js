import {
  defineAnyProperties, defineAnyIndexes,
  processModelsAnyAnnotation, generateAnyId, addAccessControlAnyParents,
  defineDeleteByOwnerEvents, defineParentDeleteTrigger
} from './utilsAny.js'

import {
  defineSetEvent, defineUpdatedEvent, defineTransferredEvent, defineResetEvent
} from './propertyEvents.js'

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
} from './singularRelationAnyUtils.js'

export default function(service, app) {
  processModelsAnyAnnotation(service, app, 'propertyOfAny', false, (config, context) => {

    context.relationWord = 'Property'
    context.reverseRelationWord = 'Owned'
    context.partialReverseRelationWord = 'Owned'

    context.sameIdAsParent = true

    context.identifiers = defineAnyProperties(context.model, context.otherPropertyNames)
    context.model.identifiers = Object.keys(context.identifiers)

    addAccessControlAnyParents(context)
    defineAnyIndexes(context.model, context.otherPropertyNames, false)

    defineObjectView(config, context,
      config.singleAccess || config.readAccess || config.singleAccessControl || config.readAccessControl
    )
    defineRangeViews(config, context,
      config.listAccess || config.readAccess || config.listAccessControl || config.readAccessControl
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

    defineSetEvent(config, context, generateAnyId)
    defineUpdatedEvent(config, context, generateAnyId)
    defineTransferredEvent(config, context, generateAnyId)
    defineResetEvent(config, context, generateAnyId)
    defineDeleteByOwnerEvents(config, context, generateAnyId)

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

    if(!config.customDeleteTrigger) defineParentDeleteTrigger(config, context)

  })
}

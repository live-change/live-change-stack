import {
  defineProperties, defineIndex,
  processModelsAnnotation, generateId
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
  defineDeleteAction,
  defineDeleteTrigger
} from './singularRelationUtils.js'

export default function(service, app) {
  processModelsAnnotation(service, app, 'boundTo', false, (config, context) => {

    context.relationWord = 'Friend'
    context.reverseRelationWord = 'Bound'
    context.partialReverseRelationWord = 'Bound'

    defineProperties(context.model, context.others, context.otherPropertyNames)
    defineIndex(context.model, context.joinedOthersClassName, context.otherPropertyNames)

    defineObjectView({ ...config, access: config.readAccess }, context,
      config.readAccess || config.readAccessControl || config.writeAccessControl
    )
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

    defineSetEvent(config, context, generateId)
    defineUpdatedEvent(config, context, generateId)
    defineTransferredEvent(config, context, generateId)
    defineResetEvent(config, context, generateId)

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
  })
}

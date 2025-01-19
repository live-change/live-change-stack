import {
  defineAnyProperties, defineAnyIndex,
  processModelsAnyAnnotation, generateAnyId
} from './utilsAny.js'

import { defineSetEvent, defineUpdatedEvent, defineTransferredEvent, defineResetEvent } from './propertyEvents.js'

import {
  defineObjectView, defineRangeViews,
  defineSetAction, defineUpdateAction, defineResetAction, defineSetOrUpdateAction,
  defineSetTrigger, defineUpdateTrigger, defineSetOrUpdateTrigger, defineResetTrigger
} from './singularRelationAnyUtils.js'
import { defineDeleteAction, defineDeleteTrigger } from './singularRelationAnyUtils.js'

export default function(service, app) {
  processModelsAnyAnnotation(service, app, 'boundToAny', false, (config, context) => {

    context.relationWord = 'Friend'
    context.reverseRelationWord = 'Bound'
    context.partialReverseRelationWord = 'Bound'

    defineAnyProperties(context.model, context.otherPropertyNames)
    defineAnyIndex(context.model, context.joinedOthersClassName, context.otherPropertyNames)

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

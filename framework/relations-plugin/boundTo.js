import {
  defineProperties, defineIndex,
  processModelsAnnotation, generateId
} from './utils.js'

import { defineSetEvent, defineUpdatedEvent, defineTransferredEvent, defineResetEvent } from './propertyEvents.js'

import {
  defineView,
  defineSetAction, defineUpdateAction, defineSetOrUpdateAction, defineResetAction,
  defineSetTrigger, defineUpdateTrigger, defineSetOrUpdateTrigger, defineResetTrigger
} from './singularRelationUtils.js'

export default function(service, app) {
  processModelsAnnotation(service, app, 'boundTo', false, (config, context) => {

    context.relationWord = 'Friend'
    context.reverseRelationWord = 'Bound'

    defineProperties(context.model, context.others, context.otherPropertyNames)
    defineIndex(context.model, context.joinedOthersClassName, context.otherPropertyNames)

    defineView({ ...config, access: config.readAccess }, context,
      config.readAccess || config.readAccessControl || config.writeAccessControl
    )
    if(config.views) {
      for(const view of config.views) {
        defineView({ ...config, ...view }, context, !view.internal)
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
  })
}

import {
  defineAnyProperties, defineAnyIndex,
  processModelsAnyAnnotation, generateAnyId
} from './utilsAny.js'

import { defineSetEvent, defineUpdatedEvent, defineTransferredEvent, defineResetEvent } from './propertyEvents.js'

import { defineView, defineSetAction, defineUpdateAction, defineResetAction } from './singularRelationUtils.js'

export default function(service, app) {
  processModelsAnyAnnotation(service, app, 'boundToAny', false, (config, context) => {

    context.relationWord = 'Friend'
    context.reverseRelationWord = 'Bound'

    defineAnyProperties(context.model, context.otherPropertyNames)
    defineAnyIndex(context.model, context.joinedOthersClassName, context.otherPropertyNames)

    if(config.readAccess || config.readAccessControl || config.writeAccessControl) {
      defineView({ ...config, access: config.readAccess }, context)
    }
    if(config.views) {
      for(const view of config.views) {
        defineView({ ...config, ...view }, context)
      }
    }

    defineSetEvent(config, context, generateAnyId)
    defineUpdatedEvent(config, context, generateAnyId)
    defineTransferredEvent(config, context, generateAnyId)
    defineResetEvent(config, context, generateAnyId)

    if(config.setAccess || config.writeAccess || config.setAccessControl || config.writeAccessControl) {
      defineSetAction(config, context)
    }

    if(config.updateAccess || config.writeAccess || config.updateAccessControl || config.writeAccessControl) {
      defineUpdateAction(config, context)
    }

    if(config.resetAccess || config.writeAccess || config.resetAccessControl || config.writeAccessControl) {
      defineResetAction(config, context);
    }

  })
}

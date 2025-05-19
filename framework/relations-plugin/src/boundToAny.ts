import {
  defineAnyProperties, defineAnyIndex,
  processModelsAnyAnnotation, generateAnyId, defineAnyTypeIndexes,
  AnyRelationConfig
} from './utilsAny.js'

import { defineSetEvent, defineUpdatedEvent, defineTransferredEvent, defineResetEvent } from './propertyEvents.js'

import {
  defineObjectView, defineRangeViews,
  defineSetAction, defineUpdateAction, defineResetAction, defineSetOrUpdateAction,
  defineSetTrigger, defineUpdateTrigger, defineSetOrUpdateTrigger, defineResetTrigger
} from './singularRelationAnyUtils.js'
import { defineDeleteAction, defineDeleteTrigger } from './singularRelationAnyUtils.js'
import { AccessSpecification } from '@live-change/framework'
import { AccessControlSettings } from './types.js'

export interface BoundToAnyConfig extends AnyRelationConfig {
  readAccess?: AccessSpecification
  writeAccess?: AccessSpecification
  readAllAccess?: AccessSpecification
  setAccess?: AccessSpecification
  updateAccess?: AccessSpecification
  setOrUpdateAccess?: AccessSpecification
  resetAccess?: AccessSpecification
  singleAccess?: AccessSpecification
  listAccess?: AccessSpecification

  readAccessControl?: AccessControlSettings
  writeAccessControl?: AccessControlSettings
  readAllAccessControl?: AccessControlSettings
  setAccessControl?: AccessControlSettings
  updateAccessControl?: AccessControlSettings
  setOrUpdateAccessControl?: AccessControlSettings
  resetAccessControl?: AccessControlSettings
  singleAccessControl?: AccessControlSettings
  listAccessControl?: AccessControlSettings

  views?: {
    type: 'range' | 'object'
    internal?: boolean
    fields?: string[]
  }[]
  
}

export default function(service, app) {
  processModelsAnyAnnotation<BoundToAnyConfig>(service, app, 'boundToAny', false, (config, context) => {

    context.relationWord = 'Friend'
    context.reverseRelationWord = 'Bound'
    context.partialReverseRelationWord = 'Bound'

    context.identifiers = defineAnyProperties(context.model, context.otherPropertyNames, config)
    defineAnyIndex(context.model, context.joinedOthersClassName, context.otherPropertyNames)
    defineAnyTypeIndexes(config, context, context.otherPropertyNames.length === 1)

    defineObjectView(config, context,
      !!(config.singleAccess || config.readAccess || config.singleAccessControl || config.readAccessControl)
    )
    defineRangeViews(config, context,
      !!(config.listAccess || config.readAccess || config.listAccessControl || config.readAccessControl)
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

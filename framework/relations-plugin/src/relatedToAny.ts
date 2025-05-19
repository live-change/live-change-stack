import {
  defineAnyProperties, defineAnyIndex, processModelsAnyAnnotation, defineAnyTypeIndexes,
  AnyRelationConfig
} from './utilsAny.js'

import {
  defineCreatedEvent, defineUpdatedEvent, defineDeletedEvent, defineTransferredEvent,
} from './itemEvents.js'

import {
  defineSingleView, defineRangeView,
  defineCreateAction, defineUpdateAction, defineDeleteAction,
  defineCreateTrigger, defineUpdateTrigger, defineDeleteTrigger,
  defineSortIndex
} from './pluralRelationAnyUtils.js'
import { AccessSpecification } from '@live-change/framework'
import { AccessControlSettings } from './types.js'

export interface RelatedToAnyConfig extends AnyRelationConfig {
  readAccess?: AccessSpecification
  writeAccess?: AccessSpecification
  createAccess?: AccessSpecification
  updateAccess?: AccessSpecification
  deleteAccess?: AccessSpecification
  copyAccess?: AccessSpecification
  readAllAccess?: AccessSpecification

  readAccessControl?: AccessControlSettings
  writeAccessControl?: AccessControlSettings
  createAccessControl?: AccessControlSettings
  updateAccessControl?: AccessControlSettings
  deleteAccessControl?: AccessControlSettings
  copyAccessControl?: AccessControlSettings
}

export default function(service, app) {
  processModelsAnyAnnotation<RelatedToAnyConfig>(service, app, 'relatedToAny',true, (config, context) => {

    context.relationWord = 'Friend'
    context.reverseRelationWord = 'Related'

    context.identifiers = defineAnyProperties(context.model, context.otherPropertyNames, config)
    defineAnyIndex(context.model, context.joinedOthersClassName, context.otherPropertyNames)
    defineAnyTypeIndexes(config, context, false)

    if(config.sortBy) {
      for(const sortFields of config.sortBy) {
        defineSortIndex(context, sortFields)
      }
    }

    defineSingleView(config, context,
      !!(config.readAccess || config.readAccessControl || config.writeAccessControl)
    )
    defineRangeView(config, context,
      !!(config.readAccess || config.readAccessControl || config.writeAccessControl)
    )
    /// TODO: multiple views with limited fields

    defineCreatedEvent(config, context)
    defineUpdatedEvent(config, context)
    defineTransferredEvent(config, context)
    defineDeletedEvent(config, context)

    defineCreateTrigger(config, context)
    defineUpdateTrigger(config, context)
    defineDeleteTrigger(config, context)

    if(config.createAccess || config.writeAccess || config.createAccessControl || config.writeAccessControl) {
      defineCreateAction(config, context)
    }

    if(config.updateAccess || config.writeAccess || config.updateAccessControl || config.writeAccessControl) {
      defineUpdateAction(config, context)
    }

    if(config.deleteAccess || config.writeAccess || config.deleteAccessControl || config.writeAccessControl) {
      defineDeleteAction(config, context)
    }
  })
}

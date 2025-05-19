import {
  defineProperties, defineIndex, processModelsAnnotation,
  RelationConfig
} from './utils.js'

import {
  defineCreatedEvent, defineUpdatedEvent, defineDeletedEvent, defineTransferredEvent,
} from './itemEvents.js'

import {
  defineSingleView, defineRangeView,
  defineCreateAction, defineUpdateAction, defineDeleteAction, defineCopyAction,
  defineCreateTrigger, defineUpdateTrigger, defineDeleteTrigger, defineCopyTrigger,
  defineSortIndex,
} from './pluralRelationUtils.js'
import { AccessSpecification } from '@live-change/framework'
import { AccessControlSettings } from './types.js'

export interface RelatedToConfig extends RelationConfig {
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
  readAllAccessControl?: AccessControlSettings
}


export default function(service, app) {
  processModelsAnnotation<RelatedToConfig>(service, app, 'relatedTo', true, (config, context) => {

    context.relationWord = 'Friend'
    context.reverseRelationWord = 'Related'

    context.identifiers = defineProperties(context.model, context.others, context.otherPropertyNames)
    defineIndex(context.model, context.joinedOthersClassName, context.otherPropertyNames)

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

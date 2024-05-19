import {
  defineProperties, defineIndex, processModelsAnnotation
} from './utils.js'

import {
  defineCreatedEvent, defineUpdatedEvent, defineDeletedEvent, defineTransferredEvent,
} from './itemEvents.js'

import {
  defineView,
  defineCreateAction, defineUpdateAction, defineDeleteAction, defineCopyAction,
  defineCreateTrigger, defineUpdateTrigger, defineDeleteTrigger, defineCopyTrigger,
  defineSortIndex,
} from './pluralRelationUtils.js'

export default function(service, app) {
  processModelsAnnotation(service, app, 'relatedTo', true, (config, context) => {

    context.relationWord = 'Friend'
    context.reverseRelationWord = 'Related'

    context.identifiers = defineProperties(context.model, context.others, context.otherPropertyNames)
    defineIndex(context.model, context.joinedOthersClassName, context.otherPropertyNames)

    if(config.sortBy) {
      for(const sortFields of config.sortBy) {
        defineSortIndex(context, sortFields)
      }
    }

    defineView(config, context,
      config.readAccess || config.readAccessControl || config.writeAccessControl
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

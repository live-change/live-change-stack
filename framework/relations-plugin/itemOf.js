import {
  defineProperties, defineIndexes,
  processModelsAnnotation, addAccessControlParents,
  defineDeleteByOwnerEvents, defineParentDeleteTriggers, defineParentCopyTriggers,
   defineGlobalRangeView
} from './utils.js'

import {
  defineCreatedEvent, defineUpdatedEvent, defineDeletedEvent, defineTransferredEvent,
  defineCopyEvent
} from './itemEvents.js'

import {
  defineSingleView, defineRangeView,
  defineCreateAction, defineUpdateAction, defineDeleteAction,
  defineCreateTrigger, defineUpdateTrigger, defineDeleteTrigger, defineCopyTrigger,
  defineSortIndex,
  defineCopyAction, defineCopyOnParentCopyTrigger
} from './pluralRelationUtils.js'

export default function(service, app) {
  processModelsAnnotation(service, app, 'itemOf', false, (config, context) => {

    context.relationWord = 'Item'
    context.reverseRelationWord = 'Owned'

    context.identifiers = defineProperties(context.model, context.others, context.otherPropertyNames)
    context.model.identifiers = [...Object.keys(context.identifiers), { name: context.modelPropertyName, field: 'id' }]

    addAccessControlParents(context)
    defineIndexes(context.model, context.otherPropertyNames.map(p => p[0].toLowerCase() + p.slice(1)), context.others)

    if(config.sortBy) {
      for(const sortFields of config.sortBy) {
        defineSortIndex(context, sortFields)
      }
    }

    defineSingleView(config, context,
      config.readAccess || config.readAccessControl || config.writeAccessControl)
    defineRangeView(config, context,
      config.readAccess || config.readAccessControl || config.writeAccessControl)
    /// TODO: multiple views with limited fields

    defineGlobalRangeView(config, context, config.readAllAccess)

    defineCreatedEvent(config, context)
    defineUpdatedEvent(config, context)
    defineTransferredEvent(config, context)
    defineDeletedEvent(config, context)
    defineDeleteByOwnerEvents(config, context)
    defineCopyEvent(config, context)

    defineCreateTrigger(config, context)
    defineUpdateTrigger(config, context)
    defineDeleteTrigger(config, context)
    defineCopyTrigger(config, context)

    if(config.createAccess || config.writeAccess || config.createAccessControl || config.writeAccessControl) {
      defineCreateAction(config, context)
    }

    if(config.updateAccess || config.writeAccess || config.updateAccessControl || config.writeAccessControl) {
      defineUpdateAction(config, context)
    }

    if(config.deleteAccess || config.writeAccess || config.deleteAccessControl || config.writeAccessControl) {
      defineDeleteAction(config, context)
    }

    if(config.copyAccess || config.copyAccessControl) {
      defineCopyAction(config, context)
    }

    if(!config.customDeleteTrigger) {
      defineParentDeleteTriggers(config, context)
    }

    if(!config.customParentCopyTrigger) {
      defineParentCopyTriggers(config, context)
      //defineCopyOnParentCopyTrigger(config, context)
    }

  })
}

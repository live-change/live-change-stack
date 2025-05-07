import { defineGlobalRangeView } from './utils.js'

import {
  defineAnyProperties, defineAnyIndexes,
  processModelsAnyAnnotation, addAccessControlAnyParents, generateAnyId, defineDeleteByOwnerEvents,
  defineParentDeleteTrigger, defineAnyTypeIndexes
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

export default function(service, app) {
  processModelsAnyAnnotation(service, app, 'itemOfAny',false, (config, context) => {

    context.relationWord = 'Item'
    context.reverseRelationWord = 'Owned'

    context.identifiers = defineAnyProperties(context.model, context.otherPropertyNames, config)
    context.model.identifiers = [...Object.keys(context.identifiers), { name: context.modelPropertyName, field: 'id' }]

    addAccessControlAnyParents(context)
    defineAnyIndexes(context.model, context.otherPropertyNames)
    defineAnyTypeIndexes(config, context, false)

    if(config.sortBy) {
      for(const sortFields of config.sortBy) {
        defineSortIndex(context, sortFields)
      }
    }

    defineSingleView(config, context,
      config.readAccess || config.writeAccess || config.readAccessControl || config.writeAccessControl)
    defineRangeView(config, context,
      config.readAccess || config.writeAccess || config.readAccessControl || config.writeAccessControl)
    /// TODO: multiple views with all properties combinations
    /// TODO: multiple views with limited fields

    defineGlobalRangeView(config, context, config.readAllAccess)

    defineCreatedEvent(config, context)
    defineUpdatedEvent(config, context)
    defineTransferredEvent(config, context)
    defineDeletedEvent(config, context)
    defineDeleteByOwnerEvents(config, context, generateAnyId)

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

    if(!config.customDeleteTrigger) defineParentDeleteTrigger(config, context)
  })
}

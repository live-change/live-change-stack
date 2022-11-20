const {
  defineProperties, defineIndexes,
  processModelsAnnotation, addAccessControlParents,
  defineDeleteByOwnerEvents, defineParentDeleteTriggers
} = require('./utils.js')

const {
  defineCreatedEvent, defineUpdatedEvent, defineDeletedEvent, defineTransferredEvent,
} = require('./itemEvents.js')

const {
  defineView, defineCreateAction, defineUpdateAction, defineDeleteAction, defineSortIndex
} = require('./pluralRelationUtils.js')

module.exports = function(service, app) {
  processModelsAnnotation(service, app, 'itemOf', false, (config, context) => {

    context.relationWord = 'Item'
    context.reverseRelationWord = 'Owned'

    context.identifiers = defineProperties(context.model, context.others, context.otherPropertyNames)
    addAccessControlParents(context)
    defineIndexes(context.model, context.otherPropertyNames, context.others)

    if(config.sortBy) {
      for(const sortFields of config.sortBy) {
        defineSortIndex(context, sortFields)
      }
    }

    if(config.readAccess || config.readAccessControl || config.writeAccessControl) {
      defineView(config, context)
    }
    /// TODO: multiple views with limited fields

    defineCreatedEvent(config, context)
    defineUpdatedEvent(config, context)
    defineTransferredEvent(config, context)
    defineDeletedEvent(config, context)
    defineDeleteByOwnerEvents(config, context)

    if(config.createAccess || config.writeAccess || config.createAccessControl || config.writeAccessControl) {
      defineCreateAction(config, context)
    }

    if(config.updateAccess || config.writeAccess || config.updateAccessControl || config.writeAccessControl) {
      defineUpdateAction(config, context)
    }

    if(config.deleteAccess || config.writeAccess || config.deleteAccessControl || config.writeAccessControl) {
      defineDeleteAction(config, context)
    }

    if(!config.customDeleteTrigger) defineParentDeleteTriggers(config, context)
  })
}
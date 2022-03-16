const {
  defineAnyProperties, defineAnyIndex,
  processModelsAnyAnnotation
} = require('./utilsAny.js')

const {
  defineCreatedEvent, defineUpdatedEvent, defineDeletedEvent, defineTransferredEvent,
} = require('./itemEvents.js')

const {
  defineView, defineCreateAction, defineUpdateAction, defineDeleteAction, defineSortIndex
} = require('./pluralRelationAnyUtils.js')

module.exports = function(service, app) {
  processModelsAnyAnnotation(service, app, 'itemOfAny',false, (config, context) => {

    context.relationWord = 'Item'
    context.reverseRelationWord = 'Owned'

    defineAnyProperties(context.model, context.otherPropertyNames)
    defineAnyIndex(context.model, context.joinedOthersClassName, context.otherPropertyNames)

    if(config.sortBy) {
      for(const sortFields of config.sortBy) {
        defineSortIndex(context, sortFields)
      }
    }

    if(config.readAccess) {
      defineView(config, context)
    }
    /// TODO: multiple views with limited fields

    defineCreatedEvent(config, context)
    defineUpdatedEvent(config, context)
    defineTransferredEvent(config, context)
    defineDeletedEvent(config, context)

    if(config.createAccess || config.writeAccess) {
      defineCreateAction(config, context)
    }

    if(config.updateAccess || config.writeAccess) {
      defineUpdateAction(config, context)
    }

    if(config.resetAccess || config.writeAccess) {
      defineDeleteAction(config, context)
    }
  })
}
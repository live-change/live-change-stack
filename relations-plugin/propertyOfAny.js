const {
  defineAnyProperties, defineAnyIndexes,
  processModelsAnyAnnotation, generateAnyId, addAccessControlAnyParents,
  defineDeleteByOwnerEvents, defineParentDeleteTrigger
} = require('./utilsAny.js')

const {
  defineSetEvent, defineUpdatedEvent, defineTransferredEvent, defineResetEvent
} = require('./propertyEvents.js')

const {
  defineObjectView, defineRangeViews, defineSetAction, defineUpdateAction, defineSetOrUpdateAction, defineResetAction
} = require('./singularRelationAnyUtils.js')
const {defineResetByOwner} = require("./propertyEvents");

module.exports = function(service, app) {
  processModelsAnyAnnotation(service, app, 'propertyOfAny', false, (config, context) => {

    context.relationWord = 'Property'
    context.reverseRelationWord = 'Owned'
    context.partialReverseRelationWord = 'Owned'

    context.identifiers = defineAnyProperties(context.model, context.otherPropertyNames)
    addAccessControlAnyParents(context)
    defineAnyIndexes(context.model, context.otherPropertyNames)

    if(config.singleAccess || config.readAccess || config.singleAccessControl || config.readAccessControl) {
      defineObjectView(config, context)
    }
    if(config.listAccess || config.readAccess || config.listAccessControl || config.readAccessControl) {
      defineRangeViews(config, context)
    }
    if(config.views) {
      for(const view of config.views) {
        defineObjectView({ ...config, ...view }, context)
      }
    }

    defineSetEvent(config, context, generateAnyId)
    defineUpdatedEvent(config, context, generateAnyId)
    defineTransferredEvent(config, context, generateAnyId)
    defineResetEvent(config, context, generateAnyId)
    defineDeleteByOwnerEvents(config, context, generateAnyId)

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

    if(!config.customDeleteTrigger) defineParentDeleteTrigger(config, context)

  })
}

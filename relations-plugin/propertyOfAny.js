const {
  defineAnyProperties, defineAnyIndex,
  processModelsAnyAnnotation, generateAnyId
} = require('./utilsAny.js')

const {
  defineSetEvent, defineUpdatedEvent, defineTransferredEvent, defineResetEvent
} = require('./propertyEvents.js')

const {
  defineView, defineSetAction, defineUpdateAction, defineSetOrUpdateAction, defineResetAction
} = require('./singularRelationAnyUtils.js')

module.exports = function(service, app) {
  processModelsAnyAnnotation(service, app, 'propertyOfAny', false, (config, context) => {

    context.relationWord = 'Property'
    context.reverseRelationWord = 'Owned'

    defineAnyProperties(context.model, context.otherPropertyNames)
    defineAnyIndex(context.model, context.joinedOthersClassName, context.otherPropertyNames)

    if(config.readAccess) {
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

    if(config.setAccess || config.writeAccess) {
      defineSetAction(config, context)
    }

    if(config.updateAccess || config.writeAccess) {
      defineUpdateAction(config, context)
    }

    if((config.setAccess && config.updateAccess) || config.writeAccess) {
      defineSetOrUpdateAction(config, context)
    }

    if(config.resetAccess || config.writeAccess) {
      defineResetAction(config, context);
    }

  })
}
const {
  defineProperties, defineIndex,
  processModelsAnnotation, generateId
} = require('./utils.js')

const { defineSetEvent, defineUpdatedEvent, defineTransferredEvent, defineResetEvent } = require('./propertyEvents.js')

const { defineView, defineSetAction, defineUpdateAction, defineResetAction } = require('./singularRelationUtils.js')

module.exports = function(service, app) {
  processModelsAnnotation(service, app, 'boundTo', false, (config, context) => {

    context.relationWord = 'Friend'
    context.reverseRelationWord = 'Bound'

    defineProperties(context.model, context.others, context.otherPropertyNames)
    defineIndex(context.model, context.joinedOthersClassName, context.otherPropertyNames)

    if(config.readAccess || config.readAccessControl || config.writeAccessControl) {
      defineView({ ...config, access: config.readAccess }, context)
    }
    if(config.views) {
      for(const view of config.views) {
        defineView({ ...config, ...view }, context)
      }
    }

    defineSetEvent(config, context, generateId)
    defineUpdatedEvent(config, context, generateId)
    defineTransferredEvent(config, context, generateId)
    defineResetEvent(config, context, generateId)

    if(config.setAccess || config.writeAccess || config.setAccessControl || config.writeAccessControl) {
      defineSetAction(config, context)
    }

    if(config.updateAccess || config.writeAccess || config.updateAccessControl || config.writeAccessControl) {
      defineUpdateAction(config, context)
    }

    if(config.resetAccess || config.writeAccess || config.resetAccessControl || config.writeAccessControl) {
      defineResetAction(config, context);
    }
  })
}

import {
  PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition, EventDefinition
} from "@live-change/framework"

function defineCreatedEvent(config, context) {
  const {
    service, modelRuntime, joinedOthersPropertyName, modelName, modelPropertyName, reverseRelationWord
  } = context
  const eventName = joinedOthersPropertyName + reverseRelationWord + modelName + 'Created'
  service.events[eventName] = new EventDefinition({
    name: eventName,
    execute(properties) {
      const id = properties[modelPropertyName]
      return modelRuntime().create({ ...properties.data, ...properties.identifiers, id })
    }
  })
}

function defineUpdatedEvent(config, context) {
  const {
    service, modelRuntime, joinedOthersPropertyName, modelName, modelPropertyName, reverseRelationWord
  } = context
  const eventName = joinedOthersPropertyName + reverseRelationWord + modelName + 'Updated'
  service.events[eventName] = new EventDefinition({
    name: eventName,
    execute(properties) {
      const id = properties[modelPropertyName]
      return modelRuntime().update(id, { ...properties.data, ...properties.identifiers, id })
    }
  })
}

function defineTransferredEvent(config, context) {
  const {
    service, modelRuntime, joinedOthersPropertyName, modelName, modelPropertyName, reverseRelationWord
  } = context
  const eventName = joinedOthersPropertyName + reverseRelationWord + modelName + 'Transferred'
  service.events[eventName] = new EventDefinition({
    name: eventName,
    execute(properties) {
      const id = properties[modelPropertyName]
      return modelRuntime().update(id, { ...properties.to, id })
    }
  })
}

function defineDeletedEvent(config, context) {
  const {
    service, modelRuntime, joinedOthersPropertyName, modelName, modelPropertyName, reverseRelationWord
  } = context
  const eventName = joinedOthersPropertyName + reverseRelationWord + modelName + 'Deleted'
  service.events[eventName] = new EventDefinition({
    name: eventName,
    execute(properties) {
      const id = properties[modelPropertyName]
      return modelRuntime().delete(id)
    }
  })
}

function defineCopyEvent(config, context) {
  const {
    service, modelRuntime, joinedOthersPropertyName, modelName, modelPropertyName, reverseRelationWord
  } = context
  const eventName = joinedOthersPropertyName + reverseRelationWord + modelName + 'Copied'
  service.events[eventName] = new EventDefinition({
    name: eventName,
    execute(properties) {
      const id = properties[modelPropertyName]
      console.log("COPY CREATE", { ...properties.data, ...properties.identifiers, id })
      return modelRuntime().create({ ...properties.data, ...properties.identifiers, id })
    }
  })
}

export {
  defineCreatedEvent, defineUpdatedEvent, defineTransferredEvent, defineDeletedEvent,
  defineCopyEvent,
}

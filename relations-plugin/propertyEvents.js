import {
  PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition, EventDefinition
} from '@live-change/framework'

function defineSetEvent(config, context, generateId) {
  const {
    service, modelRuntime, joinedOthersPropertyName, modelName, otherPropertyNames, reverseRelationWord
  } = context
  const eventName = joinedOthersPropertyName + reverseRelationWord + modelName + 'Set'
  service.events[eventName] = new EventDefinition({
    name: eventName,
    execute(properties) {
      const id = generateId(otherPropertyNames, properties.identifiers)
      return modelRuntime().create({ ...properties.data, ...properties.identifiers, id })
    }
  })
}

function defineUpdatedEvent(config, context, generateId) {
  const {
    service, modelRuntime, joinedOthersPropertyName, modelName, otherPropertyNames, reverseRelationWord
  } = context
  const eventName = joinedOthersPropertyName + reverseRelationWord + modelName + 'Updated'
  service.events[eventName] = new EventDefinition({
    name: eventName,
    execute(properties) {
      const id = generateId(otherPropertyNames, properties.identifiers)
      return modelRuntime().update(id, { ...properties.data, ...properties.identifiers })
    }
  })
}

function defineTransferredEvent(config, context, generateId) {
  const {
    service, modelRuntime, joinedOthersPropertyName, modelName, otherPropertyNames, reverseRelationWord
  } = context
  const eventName = joinedOthersPropertyName + reverseRelationWord + modelName + 'Transferred'
  service.events[eventName] = new EventDefinition({
    name: eventName,
    async execute(properties) {
      const fromId = generateId(otherPropertyNames, properties.from)
      const toId = generateId(otherPropertyNames, properties.to)
      const data = await modelRuntime().get(fromId)
      await modelRuntime().create({
        ...data,
        ...properties.to,
        id: toId
      })
      await modelRuntime().delete(fromId)
      return toId
    }
  })
}

function defineResetEvent(config, context, generateId) {
  const {
    service, modelRuntime, joinedOthersPropertyName, modelName, otherPropertyNames, reverseRelationWord
  } = context
  const eventName = joinedOthersPropertyName + reverseRelationWord + modelName + 'Reset'
  service.events[eventName] = new EventDefinition({
    name: eventName,
    execute({ identifiers }) {
      const id = generateId(otherPropertyNames, identifiers)
      return modelRuntime().delete(id)
    }
  })
}

export {
  defineSetEvent, defineUpdatedEvent, defineTransferredEvent, defineResetEvent
}

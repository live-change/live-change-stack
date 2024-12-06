import {
  PropertyDefinition, ViewDefinition, IndexDefinition, ActionDefinition, EventDefinition
} from '@live-change/framework'

function defineSetEvent(config, context, generateId) {
  const {
    service, modelRuntime, joinedOthersPropertyName, modelName, otherPropertyNames, reverseRelationWord
  } = context
  const eventName = modelName + 'Set'
  service.events[eventName] = new EventDefinition({
    name: eventName,
    properties: {
      data: {
        type: Object
      },
      identifiers: {
        type: Object
      }
    },
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
  const eventName = modelName + 'Updated'
  service.events[eventName] = new EventDefinition({
    name: eventName,
    properties: {
      data: {
        type: Object
      },
      identifiers: {
        type: Object
      }
    },
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
  const eventName = modelName + 'Transferred'
  service.events[eventName] = new EventDefinition({
    name: eventName,
    properties: {
      from: {
        type: Object
      },
      to: {
        type: Object
      }
    },
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
  const eventName = modelName + 'Reset'
  service.events[eventName] = new EventDefinition({
    name: eventName,
    properties: {
      identifiers: {
        type: Object
      }
    },
    execute({ identifiers }) {
      const id = generateId(otherPropertyNames, identifiers)
      return modelRuntime().delete(id)
    }
  })
}

export {
  defineSetEvent, defineUpdatedEvent, defineTransferredEvent, defineResetEvent
}

const {extractObjectData} = require("./utils.js")
const App = require("@live-change/framework");
const {
  TriggerDefinition
} = App

async function fireChangeTriggers(context, objectType, identifiers, object, oldData, data) {
  const { service, modelName } = context
  const changeType = data ? (oldData ? 'update' : 'create') : 'delete'
  await Promise.all([
    service.trigger({
      type: changeType+service.name[0].toUpperCase()+service.name.slice(1)+'_'+modelName,
      objectType,
      object,
      identifiers,
      data,
      oldData
    }),
    service.trigger({
      type: changeType+'Object',
      objectType,
      object,
      identifiers,
      data,
      oldData
    })
  ])
}

async function triggerDeleteOnParentDeleteTriggers(
    context, propertyName, path, objectType, object, emit) {
  const {
    service, modelRuntime, identifiers, objectType: myType, writeableProperties, modelName,
    reverseRelationWord
  } = context
  const indexName = 'by' + propertyName[0].toUpperCase() + propertyName.slice(1)
  const bucketSize = 32
  let found = false
  let bucket
  let gt = ''
  do {
    const bucket = await modelRuntime.sortedIndexRangeGet(indexName, path, {
      gt,
      limit: bucketSize
    })
    if (bucket.length > 0) found = true
    gt = bucket[bucket.length - 1].id
    const deleteTriggerPromises = bucket.map(entity => {
      return (async () => {
        await fireChangeTriggers(context, myType, identifiers, entity.to,
            extractObjectData(writeableProperties, entity, {}), null)
      })()
    })
    await Promise.all(deleteTriggerPromises)
  } while (bucket.length == bucketSize)
  if (found) {
    const eventName = propertyName + reverseRelationWord + modelName + 'DeleteByOwner'
    emit({
      type: eventName,
      ownerType: objectType,
      owner: object
    })
  }
}

function registerParentDeleteTriggers(context, config) {
  const {
    service, parentsTypes, otherPropertyNames,
  } = context
  if(parentsTypes) {
    for (const index in parentsTypes) {
      const otherType = parentsTypes[index]
      const propertyName = otherPropertyNames[index]
      const triggerName = 'delete' + otherType[0].toUpperCase() + otherType.slice(1)
      if (!service.triggers[triggerName]) service.triggers[triggerName] = []
      service.triggers[triggerName].push(new TriggerDefinition({
        name: triggerName,
        properties: {
          object: {
            type: String
          }
        },
        async execute({object}, {client, service}, emit) {
          await triggerDeleteOnParentDeleteTriggers(context, propertyName, [object],
              otherType, object, emit)
        }
      }))
    }
  } else {
    const triggerName = 'deleteObject'
    if(!service.triggers[triggerName]) service.triggers[triggerName] = []
    service.triggers[triggerName].push(new TriggerDefinition({
      name: triggerName,
      properties: {
        objectType: {
          type: String,
        },
        object: {
          type: String
        }
      },
      async execute({ objectType, object }, {client, service}, emit) {
        for(const propertyName of otherPropertyNames) {
          await triggerDeleteOnParentDeleteTriggers(context, propertyName, [objectType, object],
              objectType, object, emit)
        }
      }
    }))
  }
}

module.exports = {
  fireChangeTriggers,
  registerParentDeleteTriggers
}

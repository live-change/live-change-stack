import { extractObjectData, extractIdentifiers } from "./dataUtils.js"
import {
  TriggerDefinition
} from "@live-change/framework"

async function fireChangeTriggers(context, objectType, identifiers, object, oldData, data) {
  const { service, modelName, app } = context
  const changeType = data ? (oldData ? 'update' : 'create') : 'delete'
  //console.log("FIRE CHANGE TRIGGERS", { context, objectType, identifiers, object, oldData, data })
  //console.trace()
  const triggerParameters = { objectType, object, identifiers, data, oldData, changeType }
  await Promise.all([
    app.trigger({
      type: changeType + service.name[0].toUpperCase() + service.name.slice(1) + '_' + modelName,
    }, triggerParameters),
    app.trigger({
      type: changeType + 'Object',
    }, triggerParameters),
    app.trigger({
      type: 'change' + service.name[0].toUpperCase() + service.name.slice(1) + '_' + modelName,
    }, triggerParameters),
    app.trigger({
      type: 'changeObject',
    }, triggerParameters)
  ])
}

async function iterateChildren(context, propertyName, path, cb) {
  const {
    service, modelRuntime, objectType: myType, writeableProperties, modelName,
    reverseRelationWord, app, otherPropertyNames, sameIdAsParent
  } = context
  if(sameIdAsParent) {
    const entity = await modelRuntime().get(path)
    if(entity) await cb(entity)
  } else {
    const indexName = 'by' + propertyName[0].toUpperCase() + propertyName.slice(1)
    const bucketSize = 32
    let bucket
    let gt = ''
    do {
      bucket = await modelRuntime().sortedIndexRangeGet(indexName, path, {
        gt,
        limit: bucketSize
      })
      //console.log("BUCKET", bucket)
      if(bucket.length === 0) break
      gt = bucket[bucket.length - 1].id
      const copyTriggerPromises = bucket.map(entity => cb({ ...entity, id: entity.to }))
      await Promise.all(copyTriggerPromises)
    } while (bucket.length === bucketSize)
  }
}


async function triggerDeleteOnParentDeleteTriggers(
    context, propertyName, path, objectType, object, emit) {
  const {
    service, modelRuntime, objectType: myType, writeableProperties, modelName,
    reverseRelationWord, otherPropertyNames
  } = context

  let found = false
  await iterateChildren(context, propertyName, path, async entity => {
    found = true
    const identifiers = extractIdentifiers(otherPropertyNames, entity)
    await fireChangeTriggers(context, myType, identifiers, entity.id,
        extractObjectData(writeableProperties, entity, {}), null)
  })
  if (found) {
    const eventName = modelName + 'DeleteByOwner'
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
        timeout: config.parentDeleteTriggerTimeout,
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
      timeout: config.parentDeleteTriggerTimeout,
      async execute({ objectType, object }, {client, service}, emit) {
        for(const propertyName of otherPropertyNames) {
          await triggerDeleteOnParentDeleteTriggers(context, propertyName, [objectType, object],
              objectType, object, emit)
        }
      }
    }))
  }
}

async function copyObject(context, objectType, object, parentType, parent, identifiers, data, emit) {
  const {
    app, service, modelPropertyName, modelName, otherPropertyNames, joinedOthersPropertyName, others
  } = context
  const eventName = joinedOthersPropertyName + context.reverseRelationWord + modelName + 'Copied'
  const newIdentifiers = {
    ...identifiers
  }
  for(let i = 0; i < others.length; i++) {
    const other = others[i]
    if(other === parentType) {
      newIdentifiers[otherPropertyNames[i]] = parent
    }
  }
  console.log("COPY OBJECT", objectType, object, "TO", parentType, parent)
  console.log("IDENTIFIERS", newIdentifiers)
  console.log("DATA", data)

  const newId = app.generateUid()
  app.trigger({
    type: 'copy' + service.name[0].toUpperCase() + service.name.slice(1) + '_' + modelName,
  }, {
    objectType,
    object: newId,
    from: object,
    identifiers: newIdentifiers,
    data
  })
  app.trigger({
    type: 'copyObject',
  }, {
    objectType,
    object: newId,
    from: object,
    identifiers: newIdentifiers,
    data
  })
  await fireChangeTriggers(context, objectType, newIdentifiers, newId, null, data)
  emit({
    type: eventName,
    [modelPropertyName]: newId,
    ['from'+modelPropertyName[0].toUpperCase() + modelPropertyName.slice(1)]: object,
    identifiers: newIdentifiers,
    data
  })
}

async function triggerCopyOnParentCopyTriggers(
    context, propertyName, path, objectType, object, from, emit) {
  const {
    service, modelRuntime, objectType: myType, writeableProperties, modelName,
    reverseRelationWord, app, otherPropertyNames
  } = context
  await iterateChildren(context, propertyName, path, async entity => {
    const data = extractObjectData(writeableProperties, entity, {})
    const identifiers = extractIdentifiers(otherPropertyNames, entity)
    const fromId = entity.id

    console.log("TRIGGERED COPY", myType, fromId, "FROM", objectType, from, "TO", object)

    //console.log("COPY TRIGGER", myType, fromId, objectType, object, from, identifiers, data)
    const copyTriggerResults = await app.trigger({
      type: 'copyOnParentCopy'+service.name[0].toUpperCase()+service.name.slice(1)+'_'+modelName,
    }, {
      objectType: myType,
      object: fromId,
      parentType: objectType,
      parent: object,
      fromParent: from,
      identifiers,
      data
    })
    //console.log("COPY TRIGGER RESULTS", copyTriggerResults)
    if(copyTriggerResults.length === 0) { // normal copy, without special logic
      await copyObject(context, myType, fromId, objectType, object, identifiers, data, emit)
    }
  })
}

function registerParentCopyTriggers(context, config) {
  const {
    service, parentsTypes, otherPropertyNames, modelName
  } = context
  if(parentsTypes) {
    for (const index in parentsTypes) {
      const otherType = parentsTypes[index]
      const propertyName = otherPropertyNames[index]
      const triggerName = 'copy' + otherType[0].toUpperCase() + otherType.slice(1)
      if (!service.triggers[triggerName]) service.triggers[triggerName] = []
      service.triggers[triggerName].push(new TriggerDefinition({
        name: triggerName,
        properties: {
          object: {
            type: String
          },
          from: {
            type: String
          }
        },
        async execute({ object , from }, {client, service}, emit) {
          await triggerCopyOnParentCopyTriggers(context, propertyName, [from],
              otherType, object, from, emit)
        }
      }))
    }
  } else {
    const triggerName = 'copyObject'
    if(!service.triggers[triggerName]) service.triggers[triggerName] = []
    service.triggers[triggerName].push(new TriggerDefinition({
      name: triggerName,
      properties: {
        objectType: {
          type: String,
        },
        object: {
          type: String
        },
        from: {
          type: String
        }
      },
      async execute({ objectType, object, from }, {client, service}, emit) {
        for(const propertyName of otherPropertyNames) {
          await triggerCopyOnParentCopyTriggers(context, propertyName, [objectType, from],
              objectType, object, from, emit)
        }
      }
    }))
  }
}

export {
  fireChangeTriggers,
  registerParentDeleteTriggers,
  registerParentCopyTriggers,
}

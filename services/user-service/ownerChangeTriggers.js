import App from '@live-change/framework'
import { fireChangeTriggers, extractObjectData } from '@live-change/relations-plugin'

function fireOwnedChange({
  service, modelName, app, objectType, object, identifiers, oldData, data, trigger
}) {
  return fireChangeTriggers({
    service,
    modelName,
    app,
    objectType,
    object,
    identifiers,
    oldData,
    data,
    trigger
  })
}

export function propertyIdFromOwnerParts(ownerParts) {
  return ownerParts.map(p => JSON.stringify(p)).join(':')
}

export function polymorphicPropertyId(identifiers, ownerPrefix, extendedWith = []) {
  const parts = [
    identifiers[ownerPrefix + 'Type'],
    identifiers[ownerPrefix]
  ]
  for (const key of extendedWith) {
    parts.push(identifiers[key + 'Type'], identifiers[key])
  }
  return propertyIdFromOwnerParts(parts)
}

export async function fireItemOwnerTransferChange({
  service, modelName, app, objectType, writeableProperties,
  entity, to, trigger
}) {
  const oldData = extractObjectData(writeableProperties, entity, {})
  const data = App.utils.mergeDeep({}, oldData, to)
  await fireOwnedChange({
    service, modelName, app, objectType, object: entity.id,
    identifiers: { ...to },
    oldData,
    data,
    trigger
  })
}

export async function fireItemUpdateChange({
  service, modelName, app, objectType, writeableProperties,
  entity, data, identifiers, trigger
}) {
  await fireOwnedChange({
    service, modelName, app, objectType, object: entity.id,
    identifiers,
    oldData: extractObjectData(writeableProperties, entity, {}),
    data,
    trigger
  })
}

export async function fireItemDeleteChange({
  service, modelName, app, objectType, writeableProperties,
  entity, identifiers, trigger
}) {
  await fireOwnedChange({
    service, modelName, app, objectType, object: entity.id,
    identifiers: identifiers || {
      sessionOrUserType: entity.sessionOrUserType,
      sessionOrUser: entity.sessionOrUser,
      ownerType: entity.ownerType,
      owner: entity.owner
    },
    oldData: extractObjectData(writeableProperties, entity, {}),
    data: null,
    trigger
  })
}

export async function firePropertySetChange({
  service, modelName, app, objectType, id, identifiers, data, trigger
}) {
  await fireOwnedChange({
    service, modelName, app, objectType, object: id,
    identifiers, oldData: null, data, trigger
  })
}

export async function firePropertyUpdateChange({
  service, modelName, app, objectType, writeableProperties,
  id, identifiers, entity, data, trigger
}) {
  await fireOwnedChange({
    service, modelName, app, objectType, object: id,
    identifiers,
    oldData: entity ? extractObjectData(writeableProperties, entity, {}) : null,
    data,
    trigger
  })
}

export async function firePropertyResetChange({
  service, modelName, app, objectType, writeableProperties,
  id, identifiers, entity, trigger
}) {
  await fireOwnedChange({
    service, modelName, app, objectType, object: id,
    identifiers,
    oldData: extractObjectData(writeableProperties, entity, {}),
    data: null,
    trigger
  })
}

export async function firePropertyTransferChange({
  service, modelName, app, objectType, writeableProperties,
  fromIdentifiers, toIdentifiers, sourceEntity, ownerPrefix, extendedWith, trigger
}) {
  const fromId = polymorphicPropertyId(fromIdentifiers, ownerPrefix, extendedWith)
  const toId = polymorphicPropertyId(toIdentifiers, ownerPrefix, extendedWith)
  const data = extractObjectData(writeableProperties, sourceEntity, {})
  await fireOwnedChange({
    service, modelName, app, objectType, object: fromId,
    identifiers: fromIdentifiers,
    oldData: data,
    data: null,
    trigger
  })
  await fireOwnedChange({
    service, modelName, app, objectType, object: toId,
    identifiers: toIdentifiers,
    oldData: null,
    data,
    trigger
  })
}

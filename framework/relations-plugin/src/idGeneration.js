import { hashCompositeId, HASH_ID_PREFIX } from './hashId.js'

export function applyHashId(composite, config, { hybridTypePrefix } = {}) {
  if (!config?.hashId) return composite
  const hash = hashCompositeId(composite)
  if (config.hashId === 'hybrid' && hybridTypePrefix) {
    return hybridTypePrefix + ':' + hash
  }
  return HASH_ID_PREFIX + hash
}

export function buildCompositeId(otherPropertyNames, properties) {
  return otherPropertyNames.length > 1
    ? otherPropertyNames.map(p => JSON.stringify(properties[p])).join(':')
    : properties[otherPropertyNames[0]]
}

export function buildAnyCompositeId(otherPropertyNames, properties) {
  return otherPropertyNames
    .map(p => [p + 'Type', p])
    .flat()
    .map(p => JSON.stringify(properties[p])).join(':')
}

export function generateId(otherPropertyNames, properties, config) {
  const composite = buildCompositeId(otherPropertyNames, properties)
  if (!config?.hashId || config.hashId === 'hybrid') return composite
  const hashInput = otherPropertyNames.length > 1 ? composite : JSON.stringify(composite)
  return applyHashId(hashInput, config)
}

export function generateAnyId(otherPropertyNames, properties, config) {
  const composite = buildAnyCompositeId(otherPropertyNames, properties)
  const hybridTypePrefix = config?.hashId === 'hybrid' && otherPropertyNames.length === 1
    ? JSON.stringify(properties[otherPropertyNames[0] + 'Type'])
    : undefined
  return applyHashId(composite, config, { hybridTypePrefix })
}

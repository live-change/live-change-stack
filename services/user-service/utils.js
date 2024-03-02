function createIdentifiersProperties(keys) {
  const identifiers = {}
  if(keys) for(const key of keys) {
    identifiers[key] = {
      type: String,
      validation: ['nonEmpty']
    }
    identifiers[key + 'Type'] = {
      type: String,
      validation: ['nonEmpty']
    }
  }
  return identifiers
}

export { createIdentifiersProperties }
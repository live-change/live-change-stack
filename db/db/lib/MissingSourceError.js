class MissingSourceError extends Error {
  constructor(type, name) {
    super(`${type} ${name} not found`)
    this.name = 'MissingSourceError'
    this.code = 'missingSource'
    this.sourceType = type
    this.sourceName = name
  }
}

function assertSourceExists(database, type, name) {
  if(type === 'table') {
    if(!database.config.tables[name]) throw new MissingSourceError('table', name)
  } else if(type === 'index') {
    if(!database.config.indexes[name]) throw new MissingSourceError('index', name)
  } else if(type === 'log') {
    if(!database.config.logs[name]) throw new MissingSourceError('log', name)
  } else {
    throw new MissingSourceError(type, name)
  }
}

export { MissingSourceError, assertSourceExists }
export default MissingSourceError

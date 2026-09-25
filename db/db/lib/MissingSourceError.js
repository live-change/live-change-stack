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
    // An index may exist in config but not be INDEX_READY yet (still
    // INDEX_CREATING / INDEX_UPDATING / INDEX_SLEEPING). Reading its
    // .data snapshot in that state returns stale or partial rows,
    // which become duchy in dependent indexes. Treat a not-yet-ready
    // source as missing so the dependent sleeps and wakes when the
    // source becomes ready (wakeIndexesDependingOnSource).
    const index = database.indexes.get(name)
    if(index && index.state !== 2 /* INDEX_READY */) {
      throw new MissingSourceError('index', name)
    }
  } else if(type === 'log') {
    if(!database.config.logs[name]) throw new MissingSourceError('log', name)
  } else {
    throw new MissingSourceError(type, name)
  }
}

export { MissingSourceError, assertSourceExists }
export default MissingSourceError

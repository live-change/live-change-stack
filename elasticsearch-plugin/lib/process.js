const SearchIndexer = require("./SearchIndexer.js")

async function startSearchIndexer(service, config) {
  if(!config.indexSearch) return

  let anyIndex = false
  for(const name in service.models) if(service.models[name].definition.searchIndex) anyIndex = true
  for(const name in service.indexes) if(service.indexes[name].definition.searchIndex) anyIndex = true
  if(!anyIndex) {
    console.log("not starting search indexer - nothing to index!")
    return
  }
  console.log("starting search indexer!")
  await service.dao.request(['database', 'createTable'], service.databaseName, 'searchIndexes').catch(e => 'ok')

  service.searchIndexers = []

  const elasticsearch = service.app.connectToSearch()

  for(const modelName in service.models) {
    const model = service.models[modelName]
    const indexName = model.definition.searchIndex
    if(!indexName) continue
    const indexer = new SearchIndexer(
        service.dao, service.databaseName, 'Table', model.tableName, elasticsearch, indexName, model.definition
    )
    service.searchIndexers.push(indexer)
  }

  for(const indexName in service.indexes) {
    const index = service.indexes[indexName]
    const indexName = index.definition.searchIndex
    if(!indexName) continue
    const indexer = new SearchIndexer(
        service.dao, service.databaseName, 'Index', model.tableName, elasticsearch, indexName, index.definition
    )
    service.searchIndexers.push(indexer)
  }

  const promises = []
  for(const searchIndexer of service.searchIndexers) {
    promises.push(service.profileLog.profile({
      operation: "startIndexer", serviceName: service.name, indexName: searchIndexer.indexName
    }, () => searchIndexer.start()))
  }
  await Promise.all(promises)
  console.log("search indexer started!")
}

module.exports = startSearchIndexer
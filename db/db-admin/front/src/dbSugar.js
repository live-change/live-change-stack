
const dbRequests = [
    'createDatabase',
    'deleteDatabase',
    'clearDatabaseOpLogs',
    'clearTableOpLog',
    'clearIndexOpLog',
    'createTable',
    'deleteTable',
    'renameTable',
    'createIndex',
    'deleteIndex',
    'renameIndex',
    'createLog',
    'deleteLog',
    'renameLog',
    'put',
    'delete',
    'update',
    'putLog',
    'putOldLog',
    'query'
]

const dbViews = [
    'databasesList',
    'databases',
    'databaseConfig',
    'tablesList',
    'indexesList',
    'logsList',
    'tableCount',
    'indexesCount',
    'logsCount',
    'tables',
    'indexes',
    'logs',
    'tableConfig',
    'indexConfig',
    'indexCode',
    'logConfig',
    'tableObject',
    'tableRange',
    'tableCount',
    'tableOpLogObject',
    'tableOpLogRange',
    'tableOpLogCount',
    'indexObject',
    'indexRange',
    'indexOpLogObject',
    'indexOpLogRange',
    'indexOpLogCount',
    'logObject',
    'logRange',
    'logCount',
    'query',
    'queryObject'
]

export { dbViews, dbRequests }


const dbRequestSugar = {}

for(const request of dbRequests) {
  dbRequestSugar[request] = (...args) => [[request], ...args]
}

const dbViewSugar = {}

for(const view of dbViews) {
  dbViewSugar[view] = (...args) => [view, ...args]
}

export { dbRequestSugar, dbViewSugar }

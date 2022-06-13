
export function tableLink(dbName, table) {
  return { name: 'db:data', params: {
      position: " ",
      read: `db.tableRange($.db,$.table,$.range)`,
      write: `db.put($.db,$.table,$.object)`,
      remove: `db.delete($.db,$.table,$.object.id)`,
      params: [
        'db', JSON.stringify(dbName),
        'table', JSON.stringify(table)
      ]
    } }
}

export function logLink(dbName, table) {
  return { name: 'db:data', params: {
      position: " ",
      read: `db.logRange($.db,$.table,$.range)`,
      write: false,
      remove: false,
      params: [
        'db', JSON.stringify(dbName),
        'table', JSON.stringify(table)
      ]
    } }
}

export function indexLink(dbName, table) {
  return { name: 'db:data', params: {
      position: " ",
      read: `db.indexRange($.db,$.table,$.range)`,
      write: false,
      remove: false,
      params: [
        'db', JSON.stringify(dbName),
        'table', JSON.stringify(table)
      ]
    } }
}

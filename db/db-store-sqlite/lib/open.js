import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
import { applyPragmas } from './ident.js'

const require = createRequire(import.meta.url)
const Database = require('better-sqlite3')

export function openSqlite(dir, options = {}) {
  fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, 'data.sqlite')
  const db = new Database(file)
  applyPragmas(db, options)
  db.path = dir
  return db
}

export { Database }
export { applyPragmas, tableName, quoteIdent, createTableSql } from './ident.js'

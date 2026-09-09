import { rimraf } from 'rimraf'
import { openSqlite } from '../lib/open.js'

export async function openTestDown(dbPath) {
  await rimraf(dbPath)
  return openSqlite(dbPath)
}

export async function closeTestDown(db, dbPath) {
  if(db && db.open) db.close()
  await rimraf(dbPath)
}

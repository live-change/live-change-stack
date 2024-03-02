import test from 'tape'
import { rimraf } from "rimraf"
import createDb from './utils/createDb.js'

const dbPath = `./test.l.db`
rimraf.sync(dbPath)

const events = [
  { type: 'add', value: 1 },
  { type: 'sub', value: 2 },
  { type: 'mul', value: 10 },
  { type: 'div', value: 3 },
  { type: 'email', value: 'spam' }
]

test("store range observable", t => {
  t.plan(4)

  let db, eventsLog

  t.test('open database', async t => {
    t.plan(1)
    db = createDb(dbPath)
    t.pass('opened')
  })

  t.test("create log", async t => {
    t.plan(1)
    eventsLog = db.createLog('events')
    t.pass('log created')
  })

  t.test("insert data", async t => {
    t.plan(1)
    for(let event of events) await eventsLog.put(event)
    t.pass("data inserted to database")
  })

  t.test("close and remove database", async t => {
    t.plan(2)
    await db.close()
    t.pass('closed')
    await rimraf(dbPath)
    t.pass('removed')
  })

})

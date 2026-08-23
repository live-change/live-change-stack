import test from 'tape'
import {
  parseDumpLine,
  methodName,
  isCreateIndex,
  isPut,
  isPutOldLog,
  putTableName,
  putObjectId,
  shouldRunRequest
} from '../lib/dumpCommands.js'

test('parseDumpLine skips empty', (t) => {
  t.deepEqual(parseDumpLine(''), { skip: true })
  t.deepEqual(parseDumpLine('   '), { skip: true })
  t.end()
})

test('parseDumpLine parses request', (t) => {
  const line = JSON.stringify({
    type: 'request',
    method: ['database', 'put'],
    parameters: ['db', 'tableA', { id: 'x1' }]
  })
  const parsed = parseDumpLine(line)
  t.equal(parsed.command.type, 'request')
  t.equal(methodName(parsed.command), 'put')
  t.end()
})

test('parseDumpLine returns error for invalid json', (t) => {
  const parsed = parseDumpLine('Unhandled Rejection at: Promise')
  t.ok(parsed.error)
  t.ok(parsed.preview.startsWith('Unhandled'))
  t.end()
})

test('put helpers extract table and id', (t) => {
  const command = {
    type: 'request',
    method: ['database', 'put'],
    parameters: ['db', 'pageSnapshot', { id: 'abc' }]
  }
  t.ok(isPut(command))
  t.notOk(isPutOldLog(command))
  t.equal(putTableName(command), 'pageSnapshot')
  t.equal(putObjectId(command), 'abc')
  t.end()
})

test('shouldRunRequest skipIndex drops createIndex', (t) => {
  const createIndex = {
    type: 'request',
    method: ['database', 'createIndex'],
    parameters: ['db', 'byName', '()=>{}', {}]
  }
  const put = {
    type: 'request',
    method: ['database', 'put'],
    parameters: ['db', 't', { id: '1' }]
  }
  t.ok(isCreateIndex(createIndex))
  t.notOk(shouldRunRequest(createIndex, { skipIndex: true }))
  t.ok(shouldRunRequest(put, { skipIndex: true }))
  t.ok(shouldRunRequest({ type: 'sync' }, { skipIndex: true }))
  t.end()
})

test('shouldRunRequest onlyIndex keeps createIndex and sync', (t) => {
  const createIndex = {
    type: 'request',
    method: ['database', 'createIndex'],
    parameters: ['db', 'byName', '()=>{}', {}]
  }
  const put = {
    type: 'request',
    method: ['database', 'put'],
    parameters: ['db', 't', { id: '1' }]
  }
  t.ok(shouldRunRequest(createIndex, { onlyIndex: true }))
  t.notOk(shouldRunRequest(put, { onlyIndex: true }))
  t.ok(shouldRunRequest({ type: 'sync' }, { onlyIndex: true }))
  t.end()
})

test('shouldRunRequest excludeTables drops put and putOldLog data', (t) => {
  const put = {
    type: 'request',
    method: ['database', 'put'],
    parameters: ['db', 'Foo', { id: '1' }]
  }
  const putOldLog = {
    type: 'request',
    method: ['database', 'putOldLog'],
    parameters: ['db', 'Bar', { id: '2' }]
  }
  const createTable = {
    type: 'request',
    method: ['database', 'createTable'],
    parameters: ['db', 'Foo']
  }
  t.notOk(shouldRunRequest(put, { excludeTables: ['Foo'] }))
  t.notOk(shouldRunRequest(putOldLog, { excludeTables: ['Bar'] }))
  t.ok(shouldRunRequest(createTable, { excludeTables: ['Foo'] }))
  t.end()
})

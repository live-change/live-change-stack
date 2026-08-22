import fs from 'fs'
import { client as WSClient } from "@live-change/dao-websocket"
import lineReader from 'line-reader'
import {
  parseDumpLine,
  methodName,
  isPut,
  isPutOldLog,
  putTableName,
  putObjectId,
  shouldRunRequest
} from './dumpCommands.js'

function resolveProgressFile(progressFile) {
  if(progressFile === false || progressFile === 'false') return null
  if(progressFile === '' || progressFile == null) return null
  return progressFile
}

function writeProgressFile(path, state) {
  if(!path) return
  const text = [
    `line=${state.line ?? ''}`,
    `inFlightLine=${state.inFlightLine ?? ''}`,
    `inFlightMethod=${state.inFlightMethod ?? ''}`,
    `inFlightTable=${state.inFlightTable ?? ''}`,
    `inFlightId=${state.inFlightId ?? ''}`,
    `updatedAt=${new Date().toISOString()}`
  ].join('\n') + '\n'
  try {
    fs.writeFileSync(path, text)
  } catch(error) {
    console.error('failed to write progress file', path, error.message || error)
  }
}

async function exec(options) {
  let {
    serverUrl,
    verbose,
    file,
    targetDb,
    progressFile = 'lcdbc-exec.progress',
    fromLine = 0,
    skipIndex = false,
    onlyIndex = false,
    requestTimeout = 0,
    excludeTable
  } = options

  if(skipIndex && onlyIndex) {
    throw new Error('--skipIndex and --onlyIndex are mutually exclusive')
  }

  const excludeTables = new Set(
    Array.isArray(excludeTable)
      ? excludeTable
      : (excludeTable ? [excludeTable] : [])
  )
  const progressPath = resolveProgressFile(progressFile)
  const timeoutMs = requestTimeout > 0 ? requestTimeout : 0

  let done = false
  let sourceDb
  const startedTables = new Set()
  let lastCompletedLine = 0
  let inFlight = null
  let progressTimer = null

  const clientPromise = new Promise((resolve, reject) => {
    const client = new WSClient("commandLine", serverUrl, {
      connectionSettings: {
        logLevel: 1
      },
      onConnect: () => {
        if(verbose) console.error("connected to server")
        resolve(client)
      },
      onDisconnect: () => {
        if(verbose) console.error("disconnected from server")
        if(progressTimer) clearInterval(progressTimer)
        if(progressPath) {
          writeProgressFile(progressPath, {
            line: lastCompletedLine,
            inFlightLine: inFlight?.line,
            inFlightMethod: inFlight?.method,
            inFlightTable: inFlight?.table,
            inFlightId: inFlight?.id
          })
        }
        if(!done) {
          console.error("disconnected before request done")
          process.exit(1)
        } else {
          process.exit(0)
        }
      }
    })
  })

  lineReader.open(file == '-' ? process.stdin : file, async function(err, reader) {
    if (err) throw err

    const client = await clientPromise
    let currentPromises = []
    const maxPromises = 1
    let lineNo = 0

    if(progressPath) {
      progressTimer = setInterval(() => {
        writeProgressFile(progressPath, {
          line: lastCompletedLine,
          inFlightLine: inFlight?.line,
          inFlightMethod: inFlight?.method,
          inFlightTable: inFlight?.table,
          inFlightId: inFlight?.id
        })
      }, 1000)
    }

    function nextLine() {
      return new Promise(function(resolve, reject) {
        reader.nextLine(function(err, line) {
          if (err) return reject(err)
          resolve(line)
        })
      })
    }

    function sendRequest(method, parameters) {
      if(timeoutMs) {
        return client.requestWithSettings({ requestTimeout: timeoutMs }, method, ...parameters)
      }
      return client.request(method, ...parameters)
    }

    async function flushPending() {
      while(currentPromises.length > 0) {
        await currentPromises[0]
        currentPromises.shift()
      }
    }

    try {
      while (reader.hasNextLine()) {
        const line = await nextLine()
        lineNo++

        if(fromLine > 0 && lineNo < fromLine) continue

        const parsed = parseDumpLine(line)
        if(parsed.skip) {
          lastCompletedLine = lineNo
          continue
        }
        if(parsed.error) {
          console.error(`skip bad json line ${lineNo}: ${parsed.preview}`)
          lastCompletedLine = lineNo
          continue
        }

        const command = parsed.command
        if(command.type === 'sync') {
          await flushPending()
          lastCompletedLine = lineNo
          continue
        }

        if(command.type !== 'request') {
          lastCompletedLine = lineNo
          continue
        }

        if(!shouldRunRequest(command, { skipIndex, onlyIndex, excludeTables })) {
          lastCompletedLine = lineNo
          continue
        }

        while(currentPromises.length > maxPromises) {
          await currentPromises[0]
          currentPromises.shift()
        }

        if(!sourceDb) {
          sourceDb = command.parameters[0]
        }
        if(targetDb) {
          if(sourceDb != command.parameters[0]) {
            throw new Error(`source database changed from ${sourceDb} to ${command.parameters[0]}`)
          }
          command.parameters[0] = targetDb
        }

        const method = methodName(command)
        const table = putTableName(command)
        const objectId = putObjectId(command)

        if((isPut(command) || isPutOldLog(command)) && table && !startedTables.has(table)) {
          startedTables.add(table)
          console.error(`table put start: ${table} (line ${lineNo})`)
        }

        inFlight = {
          line: lineNo,
          method,
          table: table || '',
          id: objectId || ''
        }

        const requestPromise = sendRequest(command.method, command.parameters)
          .then(() => {
            lastCompletedLine = lineNo
            if(inFlight && inFlight.line === lineNo) inFlight = null
          })
          .catch((error) => {
            if(error === 'timeout' || error?.message === 'timeout') {
              console.error(
                `request timeout after ${timeoutMs}ms: ${method}`
                + (table ? ` table=${table}` : '')
                + (objectId != null ? ` id=${objectId}` : '')
                + ` line=${lineNo}`
              )
              if(progressPath) {
                writeProgressFile(progressPath, {
                  line: lastCompletedLine,
                  inFlightLine: lineNo,
                  inFlightMethod: method,
                  inFlightTable: table || '',
                  inFlightId: objectId || ''
                })
              }
              if(progressTimer) clearInterval(progressTimer)
              process.exit(1)
            }
            throw error
          })

        currentPromises.push(requestPromise)
      }

      await flushPending()
      reader.close(function(closeErr) {
        if (closeErr) throw closeErr
      })

      done = true
      if(progressTimer) clearInterval(progressTimer)
      if(progressPath) {
        writeProgressFile(progressPath, {
          line: lastCompletedLine,
          inFlightLine: '',
          inFlightMethod: '',
          inFlightTable: '',
          inFlightId: ''
        })
      }
      client.dispose()
    } catch(error) {
      if(progressTimer) clearInterval(progressTimer)
      console.error(error && error.stack ? error.stack : error)
      process.exit(1)
    }
  })
}

export default exec

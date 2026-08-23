import lineReader from 'line-reader'
import {
  parseDumpLine,
  shouldRunRequest
} from './dumpCommands.js'

async function filterDump(options) {
  const {
    file = '-',
    excludeTable
  } = options

  const excludeTables = Array.isArray(excludeTable)
    ? excludeTable
    : (excludeTable ? [excludeTable] : [])

  if(excludeTables.length === 0) {
    throw new Error('--excludeTable is required at least once')
  }

  const excludeSet = new Set(excludeTables)
  let lineNo = 0

  await new Promise((resolve, reject) => {
    lineReader.open(file == '-' ? process.stdin : file, function(err, reader) {
      if(err) return reject(err)

      function nextLine() {
        return new Promise(function(res, rej) {
          reader.nextLine(function(readErr, line) {
            if(readErr) return rej(readErr)
            res(line)
          })
        })
      }

      ;(async () => {
        try {
          while(reader.hasNextLine()) {
            const line = await nextLine()
            lineNo++
            const parsed = parseDumpLine(line)
            if(parsed.skip) continue
            if(parsed.error) {
              console.error(`skip bad json line ${lineNo}: ${parsed.preview}`)
              continue
            }
            const command = parsed.command
            if(command.type === 'sync') {
              process.stdout.write(line.endsWith('\n') ? line : line + '\n')
              continue
            }
            if(command.type !== 'request') continue
            if(!shouldRunRequest(command, { excludeTables: excludeSet })) continue
            process.stdout.write(line.endsWith('\n') ? line : line + '\n')
          }
          reader.close(function(closeErr) {
            if(closeErr) return reject(closeErr)
            resolve()
          })
        } catch(error) {
          reject(error)
        }
      })()
    })
  })
}

export default filterDump

import lineReader from 'line-reader'
import {
  parseDumpLine,
  accumulateDumpStats,
  dumpStatsRows,
  sortDumpStats,
  formatDumpStatsTable
} from './dumpCommands.js'

async function statsDump(options) {
  const {
    file = '-',
    sort = 'bytes',
    human = false
  } = options

  const statsMap = new Map()
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
            const lineBytes = Buffer.byteLength(line, 'utf8')
            accumulateDumpStats(statsMap, command, lineBytes)
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

  const rows = sortDumpStats(dumpStatsRows(statsMap), sort)
  console.log(formatDumpStatsTable(rows, { human }))
}

export default statsDump

import fs from 'fs'
import { Session } from './session.js'

const originalExit = process.exit.bind(process)
process.exit = (code) => {
  throw new Error('process.exit(' + code + ')')
}

function writeResult(payload) {
  fs.writeFileSync(process.env.LC_BENCH_RESULT, JSON.stringify(payload, null, 2))
}

async function main() {
  const backendName = process.env.LC_BENCH_BACKEND
  const tmpDir = process.env.LC_BENCH_TMP
  const session = new Session({ backendName, tmpDir, maxDbs: 16 })
  try {
    session.open()
    const store = session.createStore('probe')
    await store.put({ id: 'p', v: 1 })
    const got = await store.objectGet('p')
    if(!got || got.v !== 1 || got.id !== 'p') {
      throw new Error('probe get mismatch: ' + JSON.stringify(got))
    }
    await session.close({ keep: false })
    writeResult({ available: true })
    originalExit(0)
  } catch(err) {
    try { await session.close({ keep: false }) } catch(e) {}
    writeResult({
      available: false,
      reason: err && (err.message || String(err))
    })
    originalExit(1)
  }
}

main().catch(err => {
  try {
    writeResult({ available: false, reason: err && (err.message || String(err)) })
  } catch(e) {}
  originalExit(1)
})

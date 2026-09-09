import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { delay } from './assert.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const workerPath = path.join(here, 'worker.js')
const probeWorkerPath = path.join(here, 'probe-worker.js')

function tail(text, max = 8192) {
  if(!text) return ''
  if(text.length <= max) return text
  return text.slice(text.length - max)
}

function readResult(resultPath) {
  try {
    if(!fs.existsSync(resultPath)) return null
    return JSON.parse(fs.readFileSync(resultPath, 'utf8'))
  } catch(e) {
    return null
  }
}

function spawnNode(scriptPath, env, live) {
  let stdout = ''
  let stderr = ''
  const child = spawn(process.execPath, [scriptPath], {
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe']
  })
  child.stdout.on('data', chunk => {
    const s = chunk.toString()
    stdout += s
    if(live) process.stderr.write(s)
  })
  child.stderr.on('data', chunk => {
    const s = chunk.toString()
    stderr += s
    if(live) process.stderr.write(s)
  })
  const closed = new Promise(resolve => {
    child.on('close', (code, signal) => {
      resolve({
        code,
        signal,
        stdout: tail(stdout),
        stderr: tail(stderr),
        pid: child.pid
      })
    })
  })
  return { child, closed, getStdout: () => stdout, getStderr: () => stderr }
}

function killChild(child) {
  try { child.kill('SIGTERM') } catch(e) {}
  setTimeout(() => {
    try { child.kill('SIGKILL') } catch(e) {}
  }, 1000)
}

function crashResult(closed, stdout, stderr, extra = {}) {
  if(closed.signal === 'SIGSEGV' || closed.signal === 'SIGABRT') {
    return {
      status: 'fail',
      error: 'native crash ' + closed.signal,
      signal: closed.signal,
      exitCode: closed.code,
      stderr,
      stdout,
      ...extra
    }
  }
  return null
}

export async function isolateRun({
  backendName,
  file,
  tmpDir,
  resultPath,
  size,
  mapSize,
  strict,
  keep,
  timeoutMs,
  phase = 'run',
  stopOnReady = false,
  progress = false
}) {
  fs.mkdirSync(path.dirname(resultPath), { recursive: true })
  fs.mkdirSync(tmpDir, { recursive: true })
  try { fs.unlinkSync(resultPath) } catch(e) {}

  const env = {
    LC_BENCH_BACKEND: backendName,
    LC_BENCH_FILE: file,
    LC_BENCH_RESULT: resultPath,
    LC_BENCH_TMP: tmpDir,
    LC_BENCH_SIZE: String(size),
    LC_BENCH_STRICT: strict ? '1' : '0',
    LC_BENCH_KEEP: keep ? '1' : '0',
    LC_BENCH_PHASE: phase,
    LC_BENCH_PROGRESS: progress ? '1' : '0'
  }
  if(mapSize) env.LC_BENCH_MAP_SIZE = String(mapSize)

  const { child, closed } = spawnNode(workerPath, env, progress)

  const started = Date.now()
  while(true) {
    const result = readResult(resultPath)
    if(stopOnReady && result && result.status === 'ready') {
      return { ...result, ready: true, pid: child.pid, child }
    }
    const done = await Promise.race([
      closed.then(c => ({ type: 'close', closed: c })),
      delay(50).then(() => ({ type: 'tick' }))
    ])
    if(done.type === 'close') {
      const finalResult = readResult(resultPath)
      const crashed = crashResult(done.closed, done.closed.stdout, done.closed.stderr)
      if(crashed && !(finalResult && (finalResult.status === 'pass' || finalResult.status === 'skip'))) {
        return crashed
      }
      if(finalResult && finalResult.status) {
        return {
          ...finalResult,
          signal: done.closed.signal,
          exitCode: done.closed.code,
          stderr: done.closed.stderr || finalResult.stderr,
          stdout: done.closed.stdout
        }
      }
      return {
        status: 'fail',
        error: done.closed.signal
          ? 'exited with ' + done.closed.signal
          : (done.closed.code ? 'exit code ' + done.closed.code : 'worker produced no result'),
        signal: done.closed.signal,
        exitCode: done.closed.code,
        stderr: done.closed.stderr,
        stdout: done.closed.stdout
      }
    }
    if(Date.now() - started > timeoutMs) {
      killChild(child)
      const closedAfter = await closed
      return {
        status: 'fail',
        error: 'timeout after ' + timeoutMs + 'ms',
        signal: closedAfter.signal,
        exitCode: closedAfter.code,
        stderr: closedAfter.stderr,
        stdout: closedAfter.stdout
      }
    }
  }
}

export async function isolateProbe({ backendName, tmpDir, resultPath, timeoutMs = 20000 }) {
  fs.mkdirSync(path.dirname(resultPath), { recursive: true })
  fs.mkdirSync(tmpDir, { recursive: true })
  try { fs.unlinkSync(resultPath) } catch(e) {}

  const { child, closed } = spawnNode(probeWorkerPath, {
    LC_BENCH_BACKEND: backendName,
    LC_BENCH_RESULT: resultPath,
    LC_BENCH_TMP: tmpDir
  })

  const started = Date.now()
  while(true) {
    const result = readResult(resultPath)
    if(result && typeof result.available === 'boolean') {
      if(result.available === false || Date.now() - started > 500) {
        // allow process to exit cleanly
      }
      const remaining = Math.max(0, timeoutMs - (Date.now() - started))
      const done = await Promise.race([
        closed,
        delay(Math.min(2000, remaining)).then(() => null)
      ])
      if(done && (done.signal === 'SIGSEGV' || done.signal === 'SIGABRT')) {
        return { available: false, reason: 'native crash ' + done.signal }
      }
      return result
    }
    const done = await Promise.race([
      closed.then(c => ({ type: 'close', closed: c })),
      delay(50).then(() => ({ type: 'tick' }))
    ])
    if(done.type === 'close') {
      const finalResult = readResult(resultPath)
      if(finalResult && typeof finalResult.available === 'boolean') return finalResult
      if(done.closed.signal === 'SIGSEGV' || done.closed.signal === 'SIGABRT') {
        return { available: false, reason: 'native crash ' + done.closed.signal }
      }
      return {
        available: false,
        reason: done.closed.signal
          ? 'exited with ' + done.closed.signal
          : (tail(done.closed.stderr, 500) || ('exit code ' + done.closed.code))
      }
    }
    if(Date.now() - started > timeoutMs) {
      killChild(child)
      const closedAfter = await closed
      if(closedAfter.signal === 'SIGSEGV' || closedAfter.signal === 'SIGABRT') {
        return { available: false, reason: 'native crash ' + closedAfter.signal }
      }
      return { available: false, reason: 'probe timeout' }
    }
  }
}

export async function isolateWriteKillReopen(opts) {
  const write = await isolateRun({ ...opts, phase: 'write', keep: true, stopOnReady: true })
  if(write.status === 'skip') return write
  if(!write.ready) {
    return {
      status: 'fail',
      error: write.error || 'write phase did not become ready',
      signal: write.signal,
      exitCode: write.exitCode,
      stderr: write.stderr
    }
  }
  try {
    process.kill(write.pid, 'SIGKILL')
  } catch(e) {}
  await delay(100)
  const verify = await isolateRun({ ...opts, phase: 'verify', keep: true })
  return verify
}

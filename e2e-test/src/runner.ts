import { readdir, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  getE2ERegistry,
  resetE2ERegistry,
  setCurrentE2EFile,
  type E2ETestDefinition
} from './e2eSuite.js'

type Status = 'ok' | 'fail'

type TestResult = {
  file: string
  suite: string
  test: string
  status: Status
  durationMs: number
  error?: string
}

type FileResult = {
  file: string
  status: Status
  durationMs: number
}

type RunReport = {
  generatedAt: string
  files: FileResult[]
  tests: TestResult[]
  exitCode: number
  totalDurationMs: number
  runnerStartupMs: number
  testServerStartupMs: number
  collectionMs: number
  testsWallMs: number
}

type RunnerOptions = {
  setupEnv: () => Promise<unknown>
  teardownEnv: () => Promise<void>
  cwd?: string
  e2eDir?: string
  defaultPatterns?: string[]
  reportPath?: string
  commandForReport?: string
}

function toPosix(value: string): string {
  return value.split(path.sep).join('/')
}

function wildcardToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&')
  const wildcard = escaped.replace(/\*/g, '.*')
  return new RegExp(`^${wildcard}$`)
}

function parseCliArgs(argv: string[]): { patterns: string[], writeReport: boolean } {
  const patterns: string[] = []
  let writeReport = false
  for(const arg of argv) {
    if(arg === '--report-time') {
      writeReport = true
      continue
    }
    if(arg === '--') continue
    patterns.push(arg)
  }
  return { patterns, writeReport }
}

function printPreflight(files: string[], relative: (p: string) => string): void {
  console.log(`PRE-FLIGHT selected files (${files.length}):`)
  files.forEach((file, index) => {
    console.log(`  ${index + 1}. ${relative(file)}`)
  })
}

function printTestHeader(file: string, suite: string, testName: string): void {
  console.log(`RUN ${file} :: ${suite} :: ${testName}`)
}

function printTestResult(result: TestResult): void {
  const mark = result.status === 'ok' ? 'PASS' : 'FAIL'
  console.log(`${mark} ${result.file} :: ${result.test} (${(result.durationMs / 1000).toFixed(2)}s)`)
  if(result.error) console.log(`  ${result.error}`)
}

async function listE2ETestFiles(e2eDir: string): Promise<string[]> {
  const entries = await readdir(e2eDir)
  return entries
    .filter(name => name.endsWith('.test.ts'))
    .map(name => path.join(e2eDir, name))
    .sort((a, b) => a.localeCompare(b))
}

async function resolveTargetFiles(
  e2eDir: string,
  patterns: string[],
  relative: (p: string) => string
): Promise<string[]> {
  const allFiles = await listE2ETestFiles(e2eDir)
  const resolved = new Set<string>()

  for(const pattern of patterns) {
    const normalized = toPosix(pattern)
    if(normalized.includes('*')) {
      const matcher = wildcardToRegExp(normalized)
      for(const file of allFiles) {
        if(matcher.test(relative(file))) resolved.add(file)
      }
      continue
    }

    const absolute = path.isAbsolute(pattern) ? pattern : path.resolve(e2eDir, '..', pattern)
    try {
      const fileStat = await stat(absolute)
      if(fileStat.isFile()) resolved.add(absolute)
    } catch {
      // Ignore non-matching explicit pattern for glob-like UX.
    }
  }

  return [...resolved].sort((a, b) => a.localeCompare(b))
}

function renderExecutionTimeMarkdown(report: RunReport, commandForReport: string): string {
  const filesSorted = [...report.files].sort((a, b) => b.durationMs - a.durationMs)
  const testsSorted = [...report.tests].sort((a, b) => b.durationMs - a.durationMs)
  const slowTop = testsSorted.slice(0, 30)
  const failed = testsSorted.filter(test => test.status === 'fail')

  const lines: string[] = []
  lines.push('# E2E execution time report')
  lines.push('')
  lines.push(`- generatedAt: \`${report.generatedAt}\``)
  lines.push(`- command: \`${commandForReport}\``)
  lines.push(`- exitCode: \`${report.exitCode}\``)
  lines.push('')
  lines.push('## Runner and environment timing')
  lines.push('')
  lines.push(`- runner startup: \`${(report.runnerStartupMs / 1000).toFixed(2)} s\``)
  lines.push(`- test server startup: \`${(report.testServerStartupMs / 1000).toFixed(2)} s\``)
  lines.push(`- test collection/import: \`${(report.collectionMs / 1000).toFixed(2)} s\``)
  lines.push(`- tests execution wall: \`${(report.testsWallMs / 1000).toFixed(2)} s\``)
  lines.push('')
  lines.push('## Suite / files')
  lines.push('')
  lines.push('| file | status | duration |')
  lines.push('| --- | --- | ---: |')
  for(const file of filesSorted) {
    lines.push(`| \`${file.file}\` | ${file.status} | ${(file.durationMs / 1000).toFixed(2)} s |`)
  }
  lines.push('')
  lines.push('## Individual tests (top slowest)')
  lines.push('')
  lines.push('| file | test | status | duration |')
  lines.push('| --- | --- | --- | ---: |')
  for(const test of slowTop) {
    lines.push(`| \`${test.file}\` | ${test.test} | ${test.status} | ${(test.durationMs / 1000).toFixed(2)} s |`)
  }
  lines.push('')
  lines.push('## Individual tests (all)')
  lines.push('')
  lines.push('| file | test | status | duration |')
  lines.push('| --- | --- | --- | ---: |')
  for(const test of testsSorted) {
    lines.push(`| \`${test.file}\` | ${test.test} | ${test.status} | ${(test.durationMs / 1000).toFixed(2)} s |`)
  }
  lines.push('')
  lines.push('## Failures')
  lines.push('')
  if(failed.length === 0) {
    lines.push('- none')
  } else {
    for(const test of failed) {
      lines.push(`- \`${test.file}\` :: ${test.test} (${(test.durationMs / 1000).toFixed(2)} s)`)
      if(test.error) lines.push(`  - ${test.error}`)
    }
  }
  lines.push('')
  lines.push('## Raw totals')
  lines.push('')
  lines.push(`- tests: ${report.tests.length}`)
  lines.push(`- pass: ${report.tests.filter(test => test.status === 'ok').length}`)
  lines.push(`- fail: ${report.tests.filter(test => test.status === 'fail').length}`)
  lines.push(`- duration: ${(report.totalDurationMs / 1000).toFixed(2)} s`)
  lines.push('')
  return lines.join('\n')
}

async function importTests(targetFiles: string[], relative: (p: string) => string): Promise<E2ETestDefinition[]> {
  resetE2ERegistry()
  for(const absoluteFile of targetFiles) {
    setCurrentE2EFile(relative(absoluteFile))
    await import(pathToFileURL(absoluteFile).href)
  }
  setCurrentE2EFile(null)
  return getE2ERegistry()
}

export function createRunner(options: RunnerOptions) {
  const cwd = options.cwd ?? process.cwd()
  const e2eDir = options.e2eDir ?? path.join(cwd, 'e2e')
  const defaultPatterns = options.defaultPatterns ?? ['e2e/*.test.ts']
  const reportPath = options.reportPath ?? path.join(e2eDir, 'execution-time.md')
  const commandForReport = options.commandForReport ?? 'node --import tsx e2e/runner.ts e2e/*.test.ts'

  const relative = (absPath: string): string => {
    const rel = path.relative(cwd, absPath)
    return toPosix(rel)
  }

  async function runE2E(argv: string[]): Promise<number> {
    const runStart = performance.now()
    const { patterns, writeReport } = parseCliArgs(argv)

    const targetFiles = await resolveTargetFiles(e2eDir, patterns.length > 0 ? patterns : defaultPatterns, relative)
    if(targetFiles.length === 0) {
      console.error('No test files matched input patterns')
      return 1
    }
    printPreflight(targetFiles, relative)

    const runnerStartupEnd = performance.now()
    const serverStartBegin = performance.now()
    await options.setupEnv()
    const serverStartEnd = performance.now()

    const collectionBegin = performance.now()
    const testDefs = await importTests(targetFiles, relative)
    const collectionEnd = performance.now()

    const testsBegin = performance.now()
    const testResults: TestResult[] = []
    const fileTimings = new Map<string, { durationMs: number, hasFail: boolean }>()

    try {
      for(const testDef of testDefs) {
        printTestHeader(testDef.file, testDef.suite, testDef.name)
        const start = performance.now()
        let status: Status = 'ok'
        let error: string | undefined
        try {
          await testDef.run()
        } catch (e) {
          status = 'fail'
          error = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
        }
        const end = performance.now()
        const result: TestResult = {
          file: testDef.file,
          suite: testDef.suite,
          test: testDef.name,
          status,
          durationMs: end - start,
          error
        }
        printTestResult(result)
        testResults.push(result)

        const fileState = fileTimings.get(testDef.file) ?? { durationMs: 0, hasFail: false }
        fileState.durationMs += result.durationMs
        fileState.hasFail ||= status === 'fail'
        fileTimings.set(testDef.file, fileState)
      }
    } finally {
      await options.teardownEnv()
    }

    const testsEnd = performance.now()
    const runEnd = performance.now()

    const files: FileResult[] = [...fileTimings.entries()].map(([file, state]) => ({
      file,
      status: state.hasFail ? 'fail' : 'ok',
      durationMs: state.durationMs
    })).sort((a, b) => a.file.localeCompare(b.file))

    const exitCode = testResults.some(result => result.status === 'fail') ? 1 : 0
    const report: RunReport = {
      generatedAt: new Date().toISOString(),
      files,
      tests: testResults,
      exitCode,
      totalDurationMs: runEnd - runStart,
      runnerStartupMs: runnerStartupEnd - runStart,
      testServerStartupMs: serverStartEnd - serverStartBegin,
      collectionMs: collectionEnd - collectionBegin,
      testsWallMs: testsEnd - testsBegin
    }

    console.log(
      `TOTAL tests=${report.tests.length} pass=${report.tests.filter(r => r.status === 'ok').length}` +
      ` fail=${report.tests.filter(r => r.status === 'fail').length} duration=${(report.totalDurationMs / 1000).toFixed(2)}s`
    )

    if(writeReport) {
      await writeFile(reportPath, renderExecutionTimeMarkdown(report, commandForReport), 'utf8')
      console.log(`Report written to ${relative(reportPath)}`)
    }

    return exitCode
  }

  async function runCli(importMetaUrl: string, argv: string[]): Promise<void> {
    const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(importMetaUrl)
    if(!isMain) return
    runE2E(argv)
      .then(code => process.exit(code))
      .catch(async error => {
        const fallback = [
          '# E2E execution time report',
          '',
          '- status: failed to run custom runner',
          `- error: ${error instanceof Error ? error.message : String(error)}`
        ].join('\n')
        await writeFile(reportPath, fallback, 'utf8')
        throw error
      })
  }

  return {
    runE2E,
    runCli
  }
}

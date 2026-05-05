import { runE2E } from './runner.js'

runE2E(['--report-time', 'e2e/*.test.ts'])
  .then((code) => process.exit(code))
  .catch((error) => {
    throw error
  })

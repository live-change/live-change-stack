import { after, describe } from 'node:test'
import { disposeTestEnv } from './env.js'

export function e2eSuite(name: string, define: () => void): void {
  describe(name, () => {
    after(async () => {
      await disposeTestEnv()
      process.exit(0)
    })
    define()
  })
}

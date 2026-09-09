import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

export const SUITE_NAMES = ['wiring', 'contract', 'consistency', 'durability', 'table', 'bench', 'stress']

export function packageRoot() {
  return root
}

export function resolveSuites(list) {
  if(!list || list === 'all') return [...SUITE_NAMES]
  return list.split(',').map(s => s.trim()).filter(Boolean)
}

export function listSuiteFiles(suites) {
  const files = []
  for(const suite of suites) {
    if(suite.includes('/')) {
      const sep = suite.indexOf('/')
      const suiteName = suite.slice(0, sep)
      const fileBase = suite.slice(sep + 1)
      const file = path.join(root, 'suites', suiteName, fileBase + '.js')
      if(fs.existsSync(file)) {
        files.push({
          suite: suiteName,
          id: suiteName + '/' + fileBase,
          file
        })
      }
      continue
    }
    const dir = path.join(root, 'suites', suite)
    if(!fs.existsSync(dir)) continue
    for(const name of fs.readdirSync(dir).sort()) {
      if(!name.endsWith('.js')) continue
      files.push({
        suite,
        id: suite + '/' + name.replace(/\.js$/, ''),
        file: path.join(dir, name)
      })
    }
  }
  return files
}

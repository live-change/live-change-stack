import { defineConfig } from 'vite'

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { accessSync, readFileSync } from 'fs'

const packageJsonPath = dirname(fileURLToPath(import.meta.url))
  .split('/').map((part, i, arr) =>
    join(arr.slice(0, arr.length - i).join('/'), 'package.json')
  ).find(p => { try { accessSync(p); return true } catch (e) { return false } })
const packageJson = packageJsonPath ? JSON.parse(readFileSync(packageJsonPath, 'utf-8')) : {}
const version = process.env.VERSION ?? packageJson.version ?? 'unknown'

// @ts-ignore base config is JS without types
import baseViteConfig from '@live-change/frontend-base/vite-config.js'

export default defineConfig(async ({ command, mode, isSsrBuild, isPreview }: {
  command: string
  mode: string
  isSsrBuild?: boolean
  isPreview?: boolean
}) => {
  const baseConfig = await baseViteConfig({ command, mode, version, isSsrBuild, isPreview })
  return {
    ...baseConfig,
    resolve: {
      ...baseConfig.resolve,
      dedupe: [
        ...(Array.isArray(baseConfig.resolve?.dedupe) ? baseConfig.resolve.dedupe : []),
        '@codemirror/state',
        '@codemirror/view',
        '@codemirror/collab',
        '@codemirror/language',
        'codemirror'
      ],
      alias: [
        ...baseConfig.resolve.alias
      ]
    }
  }
})

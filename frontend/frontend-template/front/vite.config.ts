import { defineConfig } from 'vite'
import Pages from 'vite-plugin-pages'

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { accessSync, readFileSync } from 'fs'

const packageJsonPath = dirname(fileURLToPath(import.meta.url))
  .split('/').map((part, i, arr) =>
    join(arr.slice(0, arr.length - i).join('/'), 'package.json')
  ).find(p => { try { accessSync(p); return true } catch(e) { return false }})
const packageJson = packageJsonPath ? JSON.parse(readFileSync(packageJsonPath, 'utf-8')) : {}
const version = process.env.VERSION ?? packageJson.version ?? 'unknown'

// @ts-ignore
import baseViteConfig from '@live-change/frontend-base/vite-config.js'

export default defineConfig(async ({ command, mode, isSsrBuild, isPreview }:any) => {
  const baseConfig = (await baseViteConfig({ command, mode, version, isSsrBuild, isPreview }))
  return {
    ...baseConfig,

    define: {
      ...baseConfig.define,
    },

    plugins: [
      ...baseConfig.plugins,
      Pages({
        dirs: [
          // basic
          { dir: 'src/pages', baseRoute: '' },
          // blog
          // { dir: 'src/blog', baseRoute: 'blog' },
        ],
        extensions: ['vue', 'md'],
      }),
    ],

    resolve: {
      ...baseConfig.resolve,
      alias: [
        ...baseConfig.resolve.alias,
      ]
    }
  }
})

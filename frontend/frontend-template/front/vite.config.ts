import { defineConfig } from 'vite'
import Pages from 'vite-plugin-pages'

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { accessSync, readFileSync } from 'fs'
const currentModuleDir = dirname(fileURLToPath(import.meta.url))
const packageJsonPath = dirname(fileURLToPath(import.meta.url))
  .split('/').map((part, i, arr) =>
    join(arr.slice(0, arr.length - i).join('/'), 'package.json')
  ).find(p => { try { accessSync(p); return true } catch(e) { return false }})
const packageJson = packageJsonPath ? JSON.parse(readFileSync(packageJsonPath, 'utf-8')) : {}
const name = packageJson.name ?? "Example"
const version = process.env.VERSION ?? packageJson.version ?? 'unknown'
const homepage = process.env.BASE_HREF ?? packageJson.homepage
const domain = (homepage && homepage.match(/https\:\/\/([^\/]+)/)?.[1]) || 'example.com'

// @ts-ignore
import baseViteConfig from '@live-change/frontend-base/vite-config.js'

export default defineConfig(async ({ command, mode }) => {
  const baseConfig = (await baseViteConfig({ command, mode }))
  return {
    ...baseConfig,

    define: {
      ...baseConfig.define,
      ENV_VERSION: JSON.stringify(version),
      ENV_BRAND_NAME: JSON.stringify(name[0].toUpperCase() + name.slice(1)),
      ENV_BRAND_DOMAIN: JSON.stringify(domain),
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

import dotenv from 'dotenv'
dotenv.config()

import App from '@live-change/framework'
const app = App.app()

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { accessSync, readFileSync } from 'fs'

const packageJsonPath = dirname(fileURLToPath(import.meta.url))
  .split('/').map((part, i, arr) =>
    join(arr.slice(0, arr.length - i).join('/'), 'package.json')
  ).find(p => { try { accessSync(p); return true } catch (e) { return false } })
const packageJson = packageJsonPath ? JSON.parse(readFileSync(packageJsonPath, 'utf-8')) : {}

const name = packageJson.name ?? 'flow-frontend'
const brandName = process.env.BRAND_NAME || 'Flow editor'
const homepage = process.env.BASE_HREF ?? packageJson.homepage
const brandDomain = process.env.BRAND_DOMAIN ||
  (homepage && homepage.match(/https:\/\/([^/]+)/)?.[1]) || 'example.com'
const baseHref = process.env.BASE_HREF || homepage || 'http://localhost:8001'
const version = process.env.VERSION || packageJson.version

const clientConfig = {
  version,
  name,
  brandName,
  brandDomain,
  homepage,
  baseHref
}

app.config = {
  ...clientConfig,
  clientConfig: { ...clientConfig },
  services: [
    {
      name: 'session',
      path: '@live-change/session-service',
      createSessionOnUpdate: true
    },
    {
      name: 'flow',
      path: '@live-change/flow-service',
      ownerTypes: ['calculation_Calculation'],
      logicTypes: [
        'calculation_Constant',
        'calculation_Add',
        'calculation_Multiply',
        'calculation_Power'
      ],
      connectionTypes: ['calculation_Wire']
    },
    {
      name: 'calculation'
    }
  ]
}

export default app.config

import appConfig from './app.config.js'

import * as services from './services.list.js'
for(const serviceConfig of appConfig.services) {
  serviceConfig.module = services[serviceConfig.name]
}
appConfig.init = services['init']

import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { accessSync, readFileSync } from 'fs'

const packageJsonPath = dirname(fileURLToPath(import.meta.url))
  .split('/').map((part, i, arr) =>
    join(arr.slice(0, arr.length - i).join('/'), 'package.json')
  ).find(p => { try { accessSync(p); return true } catch(e) { return false }})
const packageJson = packageJsonPath ? JSON.parse(readFileSync(packageJsonPath, 'utf-8')) : {}

const name = packageJson.name ?? "Example"
const brandName = process.env.BRAND_NAME || (name[0].toUpperCase() + name.slice(1))
const homepage = process.env.BASE_HREF ?? packageJson.homepage
const brandDomain = process.env.BRAND_DOMAIN ||
  (homepage && homepage.match(/https\:\/\/([^\/]+)/)?.[1]) || 'example.com'
const baseHref = process.env.BASE_HREF || homepage || 'http://localhost:8001'

appConfig.clientConfig = {
  version: packageJson.version,
  name, brandName, brandDomain, homepage, baseHref,
  ...appConfig.clientConfig
}

import { starter } from '@live-change/cli'

starter(appConfig)

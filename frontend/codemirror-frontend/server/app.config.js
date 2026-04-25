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

const name = packageJson.name ?? 'codemirror-frontend'
const brandName = process.env.BRAND_NAME || (name[0].toUpperCase() + name.slice(1))
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
const baseAppConfig = {
  ...clientConfig,
  clientConfig: { ...clientConfig }
}

const contactTypes = ['email']

app.config = {
  ...baseAppConfig,
  clientConfig: {
    ...baseAppConfig.clientConfig
  },
  services: [
    {
      name: 'session',
      path: '@live-change/session-service',
      createSessionOnUpdate: true
    },
    {
      name: 'user',
      path: '@live-change/user-service'
    },
    {
      name: 'email',
      path: '@live-change/email-service'
    },
    {
      name: 'passwordAuthentication',
      path: '@live-change/password-authentication-service',
      contactTypes,
      signInWithoutPassword: true
    },
    {
      name: 'userIdentification',
      path: '@live-change/user-identification-service'
    },
    {
      name: 'identicon',
      path: '@live-change/identicon-service'
    },
    {
      name: 'accessControl',
      path: '@live-change/access-control-service',
      createSessionOnUpdate: true,
      contactTypes
    },
    {
      name: 'url',
      path: '@live-change/url-service'
    },
    {
      name: 'task',
      path: '@live-change/task-service'
    },
    {
      name: 'codemirror',
      path: '@live-change/codemirror-service',
      documentTypes: {
        markdown: {
          format: 'text'
        },
        code: {
          format: 'text'
        }
      },
      testLatency: 200
    }
  ]
}

export default app.config

import dotenv from 'dotenv'
dotenv.config()

import App from "@live-change/framework"
const app = App.app()

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
const version = process.env.VERSION || packageJson.version

const clientConfig = {
  version,
  name, brandName, brandDomain, homepage, baseHref
}
const baseAppConfig = {
  ...clientConfig,
  clientConfig: { ...clientConfig },
}

const contactTypes = ['email']

import securityConfig from './security.config.js'
import documentTypePage from './page.documentType.js'

app.config = {
  ...baseAppConfig,
  clientConfig: {
    ...baseAppConfig.clientConfig,
  },
  services: [
    {
      name: 'timer',
    },
    {
      name: 'session',
      createSessionOnUpdate: true
    },
    {
      name: 'user',
    },
    {
      name: 'email',
    },
    {
      name: 'passwordAuthentication',
      contactTypes,
      signInWithoutPassword: true
    },
    {
      name: 'userIdentification',
    },
    {
      name: 'localeSettings',
    },
    {
      name: 'identicon',
    },
    {
      name: 'accessControl',
      createSessionOnUpdate: true,
      contactTypes,
      indexed: true,
    },
    {
      name: 'scope'
    },
    {
      name: 'security',
      ...securityConfig,
    },
    {
      name: 'notification',
      contactTypes,
      notificationTypes: ['example_TestNotification']
    },
    {
      name: 'upload',
    },
    {
      name: 'image',
    },
    {
      name: 'secretCode',
    },
    {
      name: 'secretLink',
    },
    {
      name: 'messageAuthentication',
      contactTypes,
      signUp: true,
      signIn: true,
      connect: true
    },
    {
      name: 'googleAuthentication',
    },
    {
      name: 'linkedinAuthentication',
    },
    {
      name: 'url',
    },
    {
      name: 'prosemirror',
      documentTypes: {
        page: documentTypePage,
        /*rich: require('./rich.documentType.js'),*/
      },
      testLatency: 2000
    },
    {
      name: 'content',
    },
    {
      name: 'geoIp',
      geoIpCountryPath: "./data/GeoLite2-Country.mmdb",
      //geoIpDefaultCountry: "pl"
    },
    {
      name: 'vote',
    },
    {
      name: 'task',
    },
    {
      name: 'draft',
    },
    {
      name: 'agreement',
      agreements: ['privacyPolicy', 'termsOfService', 'marketing']
    },
    {
      name: 'backup',
      port: 8007
    },
  ]
}

export default app.config

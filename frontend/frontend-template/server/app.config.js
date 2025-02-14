import dotenv from 'dotenv'
dotenv.config()

import App from "@live-change/framework"
const app = App.app()

const contactTypes = ['email']

import securityConfig from './security.config.js'
import documentTypePage from './page.documentType.js'

app.config = {
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

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
      name: 'balance',
    },
    {
      name: 'billing',
      currency: 'credits',
      denomination: 1,
      minimumTopUp: 1000,
      anyTopUpPrices: [
        {
          value: 1000,
          price: 1233,
          currency: 'usd'
        }
      ],
      topUpOffers: [
        {
          value: 1000,
          price: 1200,
          currency: 'usd'
        },
        {
          value: 2300,
          price: 2450,
          currency: 'usd'
        },
        {
          value: 10000,
          price: 11000,
          currency: 'usd'
        },
      ]
    },
    {
      name: 'stripe',
      secretKey: process.env.STRIPE_SECRET_KEY,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
    },
    {
      name: 'backup',
      port: 8007
    },
  ]
}

export default app.config

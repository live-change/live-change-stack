import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'

import { chromium } from 'playwright'

import PQueue from 'p-queue'
import got from "got"

import dns from "dns/promises"

const browserQueue = new PQueue({ concurrency: config.concurrency })

async function newBrowser() {
  if(config.browserWebSocketDebuggerUrl) {
    const browser = await chromium.connect({ wsEndpoint: config.browserWebSocketDebuggerUrl })
    return browser
  } else if(config.browserUrl) {
    const browserInfo = await got.post(config.browserUrl + '/json/version').json()
    const browser = await chromium.connect({ wsEndpoint: browserInfo.webSocketDebuggerUrl })
    return browser
  } if(config.browserHost) {
    const ip = await dns.resolve4(config.browserHost)
    const browserInfo = await got.post(`http://${ip}:${config.browserPort}/json/version`).json()
    console.log("Browser info", browserInfo)
    try {
      const browser = await chromium.connectOverCDP(browserInfo.webSocketDebuggerUrl)
      return browser
    } catch (error) {
      console.error("Failed to connect to browser", error)
      throw error
    }
  } else {
    const browser = await chromium.launch({
      headless: true
    })
    return browser
  }
}

export async function runWithBrowser(func) {
  return await browserQueue.add(async () => {
    const browser = await newBrowser()
    try {
      const result = await func(browser)
      return result
    } finally {
      await browser.close()
    }
  })
}
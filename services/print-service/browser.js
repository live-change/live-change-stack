import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'

import { chromium } from 'playwright'

import PQueue from 'p-queue'
import got from "got"

const browserQueue = new PQueue({ concurrency: config.concurrency })

async function newBrowser() {
  if(config.browserWebSocketDebuggerUrl) {
    const browser = await chromium.connect({ wsEndpoint: config.browserWebSocketDebuggerUrl })
    return browser
  } else if(config.browserUrl) {
    const browserInfo = await got.post(config.browserUrl + '/json/version').json()
    const browser = await chromium.connect({ wsEndpoint: browserInfo.webSocketDebuggerUrl })
    return browser
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
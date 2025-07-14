import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'

import { chromium } from 'playwright'

import PQueue from 'p-queue'
import got from "got"

import dns from "dns/promises"

const browserQueue = new PQueue({ concurrency: config.browser.concurrency })

async function newBrowser() {
  console.log("New browser", config)
  //process.exit(0)
  if(config.browser.webSocketDebuggerUrl) {
    const url = new URL(config.browser.webSocketDebuggerUrl)
    const ip = await dns.resolve4(url.hostname)
    console.log("BROWSER WS DEBUGGER URL HOST", url.hostname, "RESOLVED TO", ip)
    url.hostname = ip
    const browser = await chromium.connect(url.href, { timeout: 10000 }) // connect by ip address
    //const browser = await chromium.connect(config.browser.webSocketDebuggerUrl, { timeout: 10000 })
    return browser
  } else if(config.browser.url) {
    const browserInfo = await got.post(config.browser.url + '/json/version').json()
    //const browser = await chromium.connect({ wsEndpoint: browserInfo.webSocketDebuggerUrl } { timeout: 60000 })
    const browser = await chromium.connect(browserInfo.webSocketDebuggerUrl, { timeout: 10000 })
    return browser
  } if(config.browser.host) {
    const ip = await dns.resolve4(config.browser.host)
    const browserInfoUrl = `http://${ip}:${config.browser.port}/json/version`
    console.log("Browser info url", browserInfoUrl)
    const browserInfo = await got.post(browserInfoUrl).json()
    console.log("Browser info", browserInfo)
    try {
      const browser = await chromium.connectOverCDP(browserInfo.webSocketDebuggerUrl,  { timeout: 10000 })
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

export async function runWithPage(func) {
  return await browserQueue.add(async () => {
    const browser = await newBrowser()
    const context = await browser.newContext()
    const page = await context.newPage()
    try {
      const result = await func(page)
      return result
    } finally {
      await page.close()
      await context.close()
      await browser.close()
    }
  })
}

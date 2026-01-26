import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'

import fs from "fs/promises"

import { task } from '@live-change/task-service'

import { runWithBrowser } from './browser.js'

import { getAuthenticatedUrl } from './authentication.js'

async function sleep(time) {
  return new Promise(resolve => setTimeout(resolve, time))
}

export const screenshotToFileTask = task({
  name: "screenshotToFile",
  properties: {
    path: {
      type: String
    },
    data: {
      type: Object
    },
    timeout: {
      type: Number
    },
    viewport: {
      type: Object,
      properties: {
        width: {
          type: Number
        },
        height: {
          type: Number
        }
      }
    },
    media: {
      type: Object
    },
    options: {
      type: Object
    },
    waitForSelector: {
      type: String
    },
    clipSelector: {
      type: String
    },
    outputPath: {
      type: String
    }
  },
  maxRetries: 5,
  retryDelay: (retryCount) => 2000 * Math.pow(2, retryCount),
  async execute({ path, data, timeout, media, options, waitForSelector, viewport, outputPath, clipSelector },
                { task, trigger, triggerService }, emit) {
    const all = 10
    let at = 0    
    const url = await getAuthenticatedUrl(path, data)
    console.log("SCREENSHOT URL", url, "DATA", data, 'PATH', path)
    let imageData
    let size
    task.progress(at++, all, 'gettingBrowserReady')
    await runWithBrowser(async browser => {
      task.progress(at++, all, 'creatingPage')
      const page = await browser.newPage()
      if(viewport) page.setViewport(viewport)
      task.progress(at++, all, 'enteringPage')
      await page.goto(url)
      task.progress(at++, all, 'waitingForLoading')
      while(true) {
        const loadingTasksCount = await page.evaluate(() => api?.globals?.$allLoadingTasks?.length)
        if(loadingTasksCount === 0) break
        await sleep(100)
      }
      if(waitForSelector) {
        task.progress(at++, all, 'waitingForSelector')
        console.log("WAITING FOR SELECTOR", waitForSelector, "AT URL", url)
        const locator = page.locator(waitForSelector)
        await locator.waitFor({ state: 'attached', timeout })
      } else {
        task.progress(at++, all, 'waitingForNetworkIdle')
        await page.waitForLoadState('networkidle')
      }
      task.progress(at++, all, 'waitingForRendering')
      await sleep(100) // wait for some time to give browser time to render
      task.progress(at++, all, 'printing')
      if(media) page.emulateMedia(media)
      const screenshotOptions = {
        type: 'png',
        ...options
      }
      if(clipSelector) {
        const clip = await page.evaluate(selector => {
          const element = document.querySelector(selector)
          if(!element) return null
          const { x, y, width, height } = element.getBoundingClientRect()
          return { x, y, width, height }
        }, clipSelector)
        if(clip) {
          screenshotOptions.clip = clip
        }
      }
      size = screenshotOptions.clip
      if(!size) {
        if(screenshotOptions.fullPage) {
          const bodyHandle = await page.$('body')
          const { width, height } = await bodyHandle.boundingBox()
          await bodyHandle.dispose()
          size = { width, height }
        } else {
          size = await page.evaluate(() => {
            return {
              width: document.documentElement.clientWidth,
              height: document.documentElement.clientHeight
            }
          })
        }
      }
      imageData = await page.screenshot(screenshotOptions)
      task.progress(at++, all, 'closingPage')
    })
    task.progress(at++, all, 'writingScreenshotToFile')
    await fs.writeFile(outputPath, imageData)
    task.progress(at++, all, 'done')
    return {
      path: outputPath,
      size
    }
  }
}, definition)





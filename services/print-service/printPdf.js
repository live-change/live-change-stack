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

export const printToPdfFileTask = task({
  name: "printToPdfFile",
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
  async execute({ path, data, timeout, media, options, waitForSelector, clipSelector, outputPath },
                { task, trigger, triggerService }, emit) {
    const all = 10
    let at = 0
    const url = await getAuthenticatedUrl(path, data)
    let pdf
    task.progress(at++, all, 'gettingBrowserReady')
    await runWithBrowser(async browser => {
      task.progress(at++, all, 'creatingPage')
      const page = await browser.newPage()
      task.progress(at++, all, 'enteringPage')
      await page.goto(url)
      task.progress(at++, all, 'waitingForLoading')
      while(true) {
        const loadingTasksCount = await page.evaluate(() => api.globals.$allLoadingTasks?.length)
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
      await page.emulateMedia(media ?? { media: 'print' })

      const pdfOptions = options ?? { format: 'A4', printBackground: true }
      if(clipSelector) {
        const clip = await page.evaluate(selector => {
          const element = document.querySelector(selector)
          if(!element) return null
          const { x, y, width, height } = element.getBoundingClientRect()
          return { x, y, width, height }
        }, clipSelector)
        if(clip) {
          pdfOptions.width = clip.width
          pdfOptions.height = clip.height
        }
      }

      pdf = await page.pdf(pdfOptions)
      task.progress(at++, all, 'closingPage')
    })
    task.progress(at++, all, 'writingPdfToFile')
    await fs.writeFile(outputPath, pdf)
    task.progress(at++, all, 'done')
    return outputPath
  }
}, definition)





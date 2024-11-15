import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'

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
    outputPath: {
      type: String
    }
  },
  async execute({ path, data, timeout, media, options, waitForSelector, outputPath }, { task, trigger, triggerService }, emit) {
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
        await page.waitForSelector(waitForSelector)
      } else {
        task.progress(at++, all, 'waitingForNetworkIdle')
        await page.waitForLoadState('networkidle')
      }
      task.progress(at++, all, 'waitingForRendering')
      await sleep(100) // wait for some time to give browser time to render
      task.progress(at++, all, 'printing')
      page.emulateMedia(media ?? { media: 'print' })
      pdf = await page.pdf( options ?? { format: 'A4', printBackground: true })
      task.progress(at++, all, 'closingPage')
    })
    task.progress(at++, all, 'writingPdfToFile')
    await fs.promises.writeFile(outputPath, pdf)
    task.progress(at++, all, 'done')
    return outputPath
  }
}, definition)





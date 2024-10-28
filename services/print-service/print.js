import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'

import { task } from '@live-change/task-service'

import { runWithBrowser } from './browser.js'

const authenticationKey = new ObservableValue(
  config.printAuthenticationKey
)

definition.authenticator({
  async prepareCredentials(credentials) {
    //console.log("PRINT AUTHENTICATOR", credentials, authenticationKey.getValue())
    if(credentials.sessionKey === authenticationKey.getValue()) {
      credentials.roles.push('admin')
      credentials.internal = true
    }
  }
})

const baseUrl = `http://${config.ssrHost}`+`:${config.ssrPort}`

export async function getPrintUrl(path, data) {
  const encodedData = encodeURIComponent(JSON.stringify(data))
  return baseUrl + path+'/' + encodedData +`?sessionKey=${await authenticationKey.getValue()}`
}

async function sleep(time) {
  return new Promise(resolve => setTimeout(resolve, time))
}

const printToPdfFile = task({
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
    outputPath: {
      type: String
    }
  },
  async execute({ path, data, timeout, media, options, outputPath }, { task, trigger, triggerService }, emit) {
    const all = 8
    const url = await getPrintUrl(path, data)
    task.progress(0, all, 'gettingBrowserReady')
    await runWithBrowser(async browser => {
      task.progress(1, all, 'creatingPage')
      const page = await browser.newPage()
      task.progress(2, all, 'enteringPage')
      await page.goto(url)
      task.progress(3, all, 'waitingForLoading')
      while(true) {
        const loadingTasksCount = await page.evaluate(() => api.globals.$allLoadingTasks?.length)
        if(loadingTasksCount === 0) break
        await sleep(100)
      }
      task.progress(4, all, 'waitingForNetworkIdle')
      await page.waitForLoadState('networkidle')
      task.progress(5, all, 'waitingForRendering')
      await sleep(100) // wait for some time to give browser time to render
      task.progress(6, all, 'printing')
      page.emulateMedia(media ?? { media: 'print' })
      const pdf = await page.pdf( options ?? { format: 'A4', printBackground: true })
      task.progress(7, all, 'closingPage')
    })
    task.progress(9, all, 'writingPdfToFile')
    await fs.promises.writeFile(outputPath, pdf)
    task.progress(10, all, 'done')
    return outputPath
  }
})


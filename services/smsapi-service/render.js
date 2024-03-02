import got from 'got'
import { JSDOM } from "jsdom"
import { convert as htmlToText } from 'html-to-text'

import definition from './definition.js'
const config = definition.config

async function renderSms(data) {
  const baseUrl = `http://${config.ssrHost||process.env.SSR_HOST||'localhost'}`+
  `:${config.ssrPort||process.env.SSR_PORT||'8001'}`

  const encodedData = encodeURIComponent(JSON.stringify(data))
  const url = `${baseUrl}/_sms/${data.action}/${data.contact}/${encodedData}`
  console.log("RENDER SMS", data, "URL", url)
  const response = await got(url)
  let body = response.body
  console.log("BASE URL", baseUrl)
  console.log("HTML", body)
  const dom = new JSDOM(body)
  const headers = JSON.parse(dom.window.document.querySelector('[data-headers]').textContent)
  const messageElements = dom.window.document.querySelectorAll("[data-html],[data-text]")
  const sms = { ...headers }
  for(let messageElement of messageElements) {
    const toText = messageElement.getAttribute('data-text')
    if(toText !== null) {
      sms.text = htmlToText(messageElement.outerHTML)
      if(messageElement.tagName == 'PRE') {
        const indentation = sms.text.match(/^ */)[0]
        const indentationRegex = new RegExp('\n' + indentation, 'g')
        sms.text = sms.text.slice(indentation.length).replace(indentationRegex, '\n')
      }
    }
  }

  console.log("sms", sms)

  return sms
}

export default renderSms

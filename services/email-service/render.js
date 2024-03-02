import got from 'got'
import inlineCss from 'inline-css'
import juice from 'juice'
import { JSDOM } from 'jsdom'
import { convert as htmlToText } from 'html-to-text'
import path from 'path'
import { URL } from 'url'

import definition from './definition.js'
const config = definition.config

const publicDir = config.publicDir || 'front/public/'

function processElement(element, images) {
  for(let i = 0; i < element.attributes.length; i++) {
    const attribute = element.attributes[i]
    const remove = attribute.nodeName == 'class' || attribute.nodeName.slice(0, 4) == 'data'
    if(remove) {
      element.removeAttribute(attribute.nodeName)
      i--
    }
  }
  for(let i = 0; i < element.children.length; i++) {
    processElement(element.children[i], images)
  }

  const src = element.getAttribute('src')
  if(src) {
    let contentId = images.get(src)
    if(!contentId) {
      contentId = 'image-'+(images.size + 1)
      images.set(src, contentId)
    }
    element.setAttribute('src', 'cid:' + contentId)
  }
  const backgroundImage = element?.style?.backgroundImage
  if(backgroundImage) {
    let contentId = images.get(backgroundImage)
    if(!contentId) {
      contentId = 'image-'+(images.size+1)
      images.set(backgroundImage, contentId)
    }
    element.setAttribute('src', 'cid:' + contentId)
  }
}

async function renderEmail(data) {
  const baseUrl = `http://${config.ssrHost||process.env.SSR_HOST||'127.0.0.1'}`+
  `:${config.ssrPort||process.env.SSR_PORT||'8001'}`

  const encodedData = encodeURIComponent(JSON.stringify(data))
  const url = `${baseUrl}/_email/${data.action}/${data.contact}/${encodedData}`
  console.log("RENDER EMAIL", data, "URL", url)
  const response = await got(url)
  let body = response.body
  console.log("BASE URL", baseUrl)
  //body = await inlineCss(body, { url })
  const juiceOptions = {
    webResources: {
      scripts: false,
      links: true,
      images: false,
      relativeTo: url
    }
  }
  /*body = await juice(body, juiceOptions)*/
  body = await new Promise((resolve, reject) => {
    juice.juiceResources(body, juiceOptions, (err, html) => {
      if(err) reject(err)
      else resolve(html)
    })
  })
  console.log("HTML", body)
  const dom = new JSDOM(body)
  const headers = JSON.parse(dom.window.document.querySelector('[data-headers]').textContent)
  const messageElements = dom.window.document.querySelectorAll("[data-html],[data-text]")
  const email = { ...headers }
  const images = new Map()
  for(let messageElement of messageElements) {
    const toHtml = messageElement.getAttribute('data-html')
    const toText = messageElement.getAttribute('data-text')
    if(toHtml !== null) {
      processElement(messageElement, images)
      email.html = messageElement.outerHTML
    }
    if(toText !== null) {
      email.text = htmlToText(messageElement.outerHTML)
      if(messageElement.tagName == 'PRE') {
        const indentation = email.text.match(/^ */)[0]
        const indentationRegex = new RegExp('\n' + indentation, 'g')
        email.text = email.text.slice(indentation.length).replace(indentationRegex, '\n')
      }
    }
  }
  console.log("IMAGES", Array.from(images.entries()))
  const imageAttachments = Array.from(images.entries()).map(([imagePath, contentId]) => {
    const imageUrl = new URL(imagePath, url)
    const file = path.resolve(publicDir, imageUrl.pathname.slice(1))
    const filename = path.basename(file)
    return {
      filename,
      path: file,
      cid: contentId
    }
  })

  email.attachments = email.attachments || []
  email.attachments.push(...imageAttachments)

  console.log("EMAIL", email)

  return email
}

export default renderEmail

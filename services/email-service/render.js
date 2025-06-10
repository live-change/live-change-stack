import got from 'got'
import juice from 'juice'
import { JSDOM } from 'jsdom'
import { convert as htmlToText } from 'html-to-text'
import path from 'path'
import { URL } from 'url'

import crypto from 'crypto'
import { ObservableValue } from '@live-change/dao'

import definition from './definition.js'
import config from './config.js'

import { runWithPage } from './browser.js'

const publicDir = config.publicDir || 'front/public/'

const authenticationKey = new ObservableValue(
  config.rendererAuthenticationKey ?? crypto.randomBytes(24).toString('hex')
)
definition.view({
  internal: true,
  global: true,
  remote: true,
  name: 'emailRendererAuthenticationKey',
  properties: { },
  returns: { type: String },
  async get() {
    return authenticationKey.getValue()
  },
  observable() {
    return authenticationKey
  }
})

definition.authenticator({
  async prepareCredentials(credentials) {
    //console.log("EMAIL AUTHENTICATOR", credentials, authenticationKey.getValue())
    if(credentials.sessionKey === authenticationKey.getValue()) {
      credentials.roles.push('admin')
      credentials.internal = true
    }
  }
})

function processElement(element, images) {
  for(let i = 0; i < element.attributes.length; i++) {
    const attribute = element.attributes[i]
    const remove = attribute.nodeName === 'class' || attribute.nodeName.slice(0, 4) === 'data'
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

async function renderEmailWithJuice(url) {
  const response = await got(url)
  let body = response.body
  console.log("BASE URL", baseUrl)

  let dom = new JSDOM(body)
  //console.log("RENDER EMAIL HEADERS HTML:", dom.window.document.querySelector('[data-headers]').innerHTML)
  const headersJson = dom.window.document.querySelector('[data-headers]').textContent
  //console.log("RENDER EMAIL HEADERS JSON:", headersJson)
  const headers = JSON.parse(headersJson)
  //console.log("PARSED HEADERS", headers)

  const juiceOptions = {
    webResources: {
      scripts: false,
      links: true,
      images: false,
      resolveCSSVariables: true,
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
  //console.log("RENDER EMAIL HTML", body)
  dom = new JSDOM(body)

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
      if(messageElement.tagName === 'PRE') {
        const indentation = email.text.match(/^ */)[0]
        const indentationRegex = new RegExp('\n' + indentation, 'g')
        email.text = email.text.slice(indentation.length).replace(indentationRegex, '\n')
      }
    }
  }
  console.log("IMAGES", Array.from(images.entries()))
  const imageAttachments = await processImageAttachments(images, url)

  email.attachments = email.attachments || []
  email.attachments.push(...imageAttachments)

  console.log("EMAIL", email)

  return email
}

import fs from 'fs/promises'

async function processImageAttachments(images, url) {
  return Promise.all(Array.from(images.entries()).map(async ([imagePath, contentId]) => {
    if (imagePath.startsWith('http')) {
      console.log("EXTERNAL IMAGE", imagePath)
      return {
        path: imagePath,
        cid: contentId,
        filename
      }
    }
    const imageUrl = new URL(imagePath, url)
    const file = path.resolve(publicDir, imageUrl.pathname.slice(1))
    const filename = path.basename(file)
    console.log("LOCAL IMAGE", filename)
    // check if file exists
    if(fs.access(file).catch(() => false)) {
      console.log("LOCAL IMAGE DOES NOT EXIST", file) // paths must be wrong, return external image
      const imageUrl = new URL(imagePath, url)
      return {
        path: imageUrl.toString(),
        cid: contentId,
        filename
      }
    }
    return {
      filename,
      path: file,
      cid: contentId
    }
  }))
}

async function renderEmailWithBrowser(url) {
  
  const email =await runWithPage(async (page) => {    
    console.log("RENDER EMAIL WITH BROWSER", url)
    await page.goto(url)
    return await page.evaluate(() => {
      const ALLOWED_CSS_PROPERTIES = new Set([
        'background',
        'background-blend-mode',
        'background-clip',
        'background-color',
        'background-image',
        'background-origin',
        'background-position',
        'background-repeat',
        'background-size',
        'border',
        'border-bottom',
        'border-bottom-color',
        'border-bottom-left-radius',
        'border-bottom-right-radius',
        'border-bottom-style',
        'border-bottom-width',
        'border-collapse',
        'border-color',
        'border-left',
        'border-left-color',
        'border-left-style',
        'border-left-width',
        'border-radius',
        'border-right',
        'border-right-color',
        'border-right-style',
        'border-right-width',
        'border-spacing',
        'border-style',
        'border-top',
        'border-top-color',
        'border-top-left-radius',
        'border-top-right-radius',
        'border-top-style',
        'border-top-width',
        'border-width',
        'box-sizing',
        'color',
        'display',
        'float',
        'font',
        'font-family',
        'font-feature-settings',
        'font-size',
        'font-size-adjust',
        'font-stretch',
        'font-style',
        'font-weight',
        'height',
        'letter-spacing',
        'line-height',
        'list-style',
        'list-style-position',
        'list-style-type',
        'margin',
        'margin-bottom',
        'margin-left',
        'margin-right',
        'margin-top',
        'max-height',
        'max-width',
        'min-height',
        'min-width',
        'opacity',
        'outline',
        'outline-color',
        'outline-style',
        'outline-width',
        'overflow',
        'overflow-x',
        'overflow-y',
        'padding',
        'padding-bottom',
        'padding-left',
        'padding-right',
        'padding-top',
        'table-layout',
        'text-align',
        'text-decoration',
        'text-decoration-color',
        'text-decoration-line',
        'text-decoration-style',
        'text-indent',
        'text-overflow',
        'text-transform',
        'vertical-align',
        'white-space',
        'width',
        'word-break',
        'word-spacing',
        'word-wrap'
      ])
    
      function getCSSDefinedStylesWithLayers(element) {
        const computedStyles = window.getComputedStyle(element)
        const styles = {}
        const layerRules = []
    
        for (const sheet of document.styleSheets) {
          try {
            for (const rule of sheet.cssRules) {
              if (rule instanceof CSSLayerBlockRule) {
                // Przechodzi przez zdefiniowane warstwy
                for (const subRule of rule.cssRules) {
                  if (subRule instanceof CSSStyleRule && element.matches(subRule.selectorText)) {
                    layerRules.push(subRule)
                  }
                }
              } else if (rule instanceof CSSStyleRule && element.matches(rule.selectorText)) {
                layerRules.push(rule)
              }
            }
          } catch (e) {
            console.warn('Nie można odczytać stylów z:', sheet.href)
          }
        }
    
        // Zastosowanie reguł w kolejności ich priorytetu
        for (const rule of layerRules) {
          for (const prop of rule.style) {
            styles[prop] = computedStyles.getPropertyValue(prop)
          }
        }
    
        return styles
      }
    
      function getFilteredComputedStyles(element) {
        const definedStyles = getCSSDefinedStylesWithLayers(element)
        const filteredStyles = {}
    
        for (const prop in definedStyles) {
          if (ALLOWED_CSS_PROPERTIES.has(prop)) {
            filteredStyles[prop] = definedStyles[prop]
          }
        }
    
        return filteredStyles
      }
    
      function cssStyleDeclarationToString(styles) {
        return Object.entries(styles)
          .map(([prop, value]) => `${prop}: ${value};`)
          .join(' ')
      }
    
      function inlineImportantStyles(root) {
        const treeWalker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
    
        while (treeWalker.nextNode()) {
          const element = treeWalker.currentNode
          const filteredStyles = getFilteredComputedStyles(element)
          const inheritedStyles = getInheritedStyles(element)
    
          // Usuwamy style, które są takie same jak u rodzica
          for (const prop in inheritedStyles) {
            if (filteredStyles[prop] === inheritedStyles[prop]) {
              delete filteredStyles[prop]
            }
          }
    
          const inlineStyle = cssStyleDeclarationToString(filteredStyles)
          if (inlineStyle) {
            element.setAttribute('style', inlineStyle)
          }
    
          // Usuwanie klas
          element.removeAttribute('class')
        }
      }
    
      function getInheritedStyles(element) {
        const inheritedStyles = {}
        let parent = element.parentElement
    
        while (parent) {
          const parentStyles = window.getComputedStyle(parent)
          for (let i = 0; i < parentStyles.length; i++) {
            const prop = parentStyles[i]
            if (!inheritedStyles[prop]) {
              inheritedStyles[prop] = parentStyles.getPropertyValue(prop)
            }
          }
          parent = parent.parentElement
        }
    
        return inheritedStyles
      }

      // Get headers
      const headersJson = document.querySelector('[data-headers]').textContent
      const headers = JSON.parse(headersJson)
      
      // Process HTML and text versions
      const messageElements = document.querySelectorAll("[data-html],[data-text]")
      const email = { ...headers }
      
      for(let messageElement of messageElements) {
        const toHtml = messageElement.getAttribute('data-html')
        const toText = messageElement.getAttribute('data-text')
        
        if(toHtml !== null) {
          inlineImportantStyles(messageElement)
          email.html = messageElement.outerHTML
        }
        if(toText !== null) {
          email.text = messageElement.innerText
          if(messageElement.tagName === 'PRE') {
            const indentation = email.text.match(/^ */)[0]
            const indentationRegex = new RegExp('\n' + indentation, 'g')
            email.text = email.text.slice(indentation.length).replace(indentationRegex, '\n')
          }
        }
      }

      return email
    })
  })

  // process element to remove unwanted attributes and extract images using jsdom
  const dom = new JSDOM(email.html)
  const images = new Map()
  const messageElements = dom.window.document.querySelectorAll("[data-html]")
  for(let messageElement of messageElements) {
    processElement(messageElement, images)
  }
  email.html = dom.serialize()
  dom.window.close()

  console.log("IMAGES", Array.from(images.entries()))
  const imageAttachments = await processImageAttachments(images, url)

  email.attachments = email.attachments || []
  email.attachments.push(...imageAttachments)

  console.log("EMAIL", email)

  return email
}

export { renderEmailWithJuice, renderEmailWithBrowser }

async function renderEmail(data) {
  console.log("RENDER EMAIL WITH CONFIG", config)
  const baseUrl = config.ssrUrl

  const encodedData = encodeURIComponent(JSON.stringify(data))
  const url = `${baseUrl}/_email/${data.action}/${data.contact}/${encodedData}`
    +`?sessionKey=${await authenticationKey.getValue()}`
  console.log("RENDER EMAIL", data, "URL", url)
  if(config.renderMethod === 'juice') {
    return renderEmailWithJuice(url)
  } else if(config.renderMethod === 'browser') {
    return renderEmailWithBrowser(url)
  }
}

export default renderEmail

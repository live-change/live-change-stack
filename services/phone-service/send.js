import definition from './definition.js'
const config = definition.config

import App from '@live-change/framework'
const app = App.app()

import renderSms from './render.js'

import { SMSAPI } from 'smsapi'
const smsapi = new SMSAPI(config.accessToken || process.env.SMSAPI_ACCESS_TOKEN)

const SentSms = definition.model({
  name: "SentSms",
  properties: {
    contnet: {
      type: Object
    },
    error: {
      type: Object
    },
    result: {
      type: Object
    }
  }
})

definition.trigger({
  name: "sendPhoneMessage",
  properties: {
    message: {
      type: String
    },
    content: {
      type: Object
    },
    render: {
      type: Object
    }
  },
  async execute({ message, content, render }, context, emit) {
    if(render) {
      content = await renderSms(render)
    }
    const { text, to, from } = content
    if(!text) throw new Error('text must be defined')
    if(!to) throw new Error('to must be defined')
    if(!message) message = app.generateUid()
    if(to === "+4823232323") {
      console.log("TEST SMS", text)
      emit({
        type: 'sent',
        content,
        message: 'test-' + message,
        result: 'test-sms'
      })
      return "test-sms-sent"
    }
    // return new Promise((resolve, reject) => {
    smsapi.sms.sendSms(to, text, {
      from,
      encoding: 'utf-8',
      maxParts: 10
    }).then( info => {
      emit({
        type: 'sent',
        content,
        message,
        result: info
      })
      //resolve("sent")
    })
    .catch((error) => {
      emit({
        type: 'error',
        content,
        message,
        error
      })
      console.log("SMS ERROR", error)
      //reject("sendFailed")
    })
  }
})

definition.event({
  name: "sent",
  properties: {
    message: {
      type: String
    },
    phone: {
      type: String
    },
    content: {
      type: Object
    }
  },
  async execute({ message, content, result }) {
    if(!message) message = app.generateUid()
    await SentSms.create({ id: message, content, result })
  }
})

definition.event({
  name: "error",
  properties: {
    message: {
      type: String
    },
    content: {
      type: Object
    },
    error: {
      type: Object
    }
  },
  async execute({ message, content, error }) {
    if(!message) message = app.generateUid()
    await SentSms.create({ id: message, content, error })
  }
})
import definition from './definition.js'
import App from ('@live-change/framework'

const renderSms = require('./render.js')
const config = definition.config

const SMSAPI = require('smsapi').SMSAPI
const smsapi = new SMSAPI({
  oauth: {
    accessToken: config.accessToken || process.env.SMSAPI_ACCESS_TOKEN
  }
})

const from = config.from || process.env.SMS_FROM


const SentSms = definition.model({
  name: "SentSms",
  properties: {
    phone: {
      type: Object
    },
    text: {
      type: String
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
  name: "sendSms",
  properties: {
    smsId: {
      type: String
    },
    phone: {
      type: String,
      validation: ['nonEmpty']
    },
    text: {
      type: String,
      validation: ['nonEmpty']
    }
  },
  async execute({ smsId, sms, render }, context, emit) {
    if(render) {
      sms = await renderSms(render)
    }
    if(!sms) throw new Error('sms must be defined')
    if(!smsId) smsId = app.generateUid()
    const { phone, text } = sms
    if(phone == "+4823232323") {
      console.log("TEST SMS", text)
      emit({
        type: 'sent',
        phone, text, smsId: 'test-' + smsId,
        result: 'test-sms'
      })
      return "test-sms-sent"
    }
    // return new Promise((resolve, reject) => {
    smsapi.message
        .sms()
        .from(from || 'Eco')
        .dataEncoding('utf8')
        .to(phone)
        .maxParts(10)
        .message(text)
        .execute()
        .then( info => {
          emit({
            type: 'sent',
            phone, text, smsId,
            result: info
          })
          //resolve("sent")
        })
        .catch((error) => {
          emit({
            type: 'error',
            phone, text, smsId,
            error
          })
          console.log("SMS ERROR", error)
          //reject("sendFailed")
        })
    //  })
  }
})

definition.event({
  name: "sent",
  properties: {
    smsId: {
      type: String
    },
    phone: {
      type: String
    },
    text: {
      type: String
    },
    result: {
      type: Object
    }
  },
  async execute({ smsId, phone, text, result }) {
    if(!smsId) smsId = app.generateUid()
    await SentSms.create({ id: smsId, phone, text, result })
  }
})


definition.event({
  name: "error",
  properties: {
    smsId: {
      type: String
    },
    phone: {
      type: String
    },
    text: {
      type: String
    },
    error: {
      type: Object
    }
  },
  async execute({ smsId, phone, text, error }) {
    if(!smsId) smsId = app.generateUid()
    await SentSms.create({ id: smsId, phone, text, error })
  }
})
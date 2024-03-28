import definition from './definition.js'

import nodemailer from 'nodemailer'
import App from '@live-change/framework'
const app = App.app()

import renderEmail from './render.js'

const config = definition.config

const smtp = nodemailer.createTransport(config.transport || {
  host: config.host || process.env.SMTP_HOST,
  port: +(config.port || process.env.SMTP_PORT),
  auth: {
    user: (config.user || process.env.SMTP_USER),
    pass: (config.password || process.env.SMTP_PASSWORD)
  },
  secure: (config.secure || process.env.SMTP_SECURE) !== undefined
      ? !!((config.secure || process.env.SMTP_SECURE))
      : undefined, // secure:true for port 465, secure:false for port 587
  tls: {
    // do not fail on invalid certs
    rejectUnauthorized: !(config.ignoreTLS || process.env.SMTP_IGNORE_TLS)
  }
})

const SentEmail = definition.model({
  name: "SentEmail",
  properties: {
    content: {
      type: Object,
    },
    error: {
      type: Object
    },
    smtp: {
      type: Object
    }
  }
})

definition.trigger({
  name: "sendEmailMessage",
  properties: {
    message: {
      type: String
    },
    email: {
      type: Object
    },
    render: {
      type: Object
    }
  },
  async execute({ message, content, render }, context, emit) {
    if(render) content = await renderEmail(render)
    if(!message) message = app.generateUid()
    if(!content) throw new Error('email must be defined')

    const { to, text } = content
    if(!to) throw new Error('to must be defined')
    if(!text) throw new Error('text must be defined')

    if(to.match(/@test\.com>?$/)) {
      console.log("TEST EMAIL TO", content.to)
      emit({
        type: 'sent',
        message,
        content,
        result: {
          test: true
        }
      })
      return
    }
    const doSendEmail = async () => { // async it can be very slow :/
      try {
        console.log("SEND EMAIL", content);
        const info = await smtp.sendMail(content)
        emit({
          type: 'sent',
          message,
          content,
          result: {
            messageId: info.messageId,
            response: info.response
          }
        })
        console.log("EMAIL SENT!", info)
      } catch(error) {
        console.error("EMAIL ERROR", error)
        emit({
          type: 'error',
          message,
          content,
          error: error
        })
      }
    }
    doSendEmail()
  }
})

definition.event({
  name: "sent",
  properties: {
    message: {
      type: String
    },
    content: {
      type: Object
    },
    result: {
      type: Object
    }
  },
  async execute({ message, content, result }) {
    await SentEmail.create({ id: message, content, result })
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
    await SentEmail.create({ id: message, content, error })
  }
})

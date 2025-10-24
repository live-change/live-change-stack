import definition from './definition.js'

import nodemailer from 'nodemailer'
import App from '@live-change/framework'
const app = App.app()

import renderEmail from './render.js'

import config from './config.js'

const smtp = nodemailer.createTransport(config.smtp)

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
    },
  },
  async execute({ message, email: content, render }, context, emit) {
    if(render) content = await renderEmail(render)
    if(!message) message = app.generateUid()
    if(!content) throw new Error('content must be defined')

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

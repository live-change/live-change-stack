const definition = require('./definition.js')

const nodemailer = require('nodemailer')
const app = require('@live-change/framework').app()

const renderEmail = require('./render.js')

const config = definition.config

const smtp = nodemailer.createTransport(config.transport || {
  host: config.host || process.env.SMTP_HOST,
  port: +(config.port || process.env.SMTP_PORT),
  auth: {
    user: (config.user || process.env.SMTP_USER),
    pass: (config.password || process.env.SMTP_PASSWORD)
  },
  secure: !(config.insecure || process.env.SMTP_INSECURE), // secure:true for port 465, secure:false for port 587
  tls: {
    // do not fail on invalid certs
    rejectUnauthorized: !(config.ignoreTLS || process.env.SMTP_IGNORE_TLS)
  }
})

const SentEmail = definition.model({
  name: "SentEmail",
  properties: {
    email: {
      type: Object
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
    emailId: {
      type: String
    },
    email: {
      type: Object
    },
    render: {
      type: Object
    }
  },
  async execute({ emailId = app.generateUid(), email, render }, context, emit) {
    if(render) {
      email = await renderEmail(render)
    }
    if(!email) throw new Error('email must be defined')

    if(email.to.match(/@test\.com>?$/)) {
      console.log("TEST EMAIL TO", email.to)
      emit({
        type: 'sent',
        emailId,
        email: email,
        smtp: {
          test: true
        }
      })
      return
    }
    const doSendEmail = async () => { // async it can be very slow :/
      try {
        console.log("SEND EMAIL", email);
        const info = await smtp.sendMail(email)
        emit({
          type: 'sent',
          emailId,
          email: email,
          smtp: {
            messageId: info.messageId,
            response: info.response
          }
        })
        console.log("EMAIL SENT!", info)
      } catch(error) {
        console.error("EMAIL ERROR", error)
        emit({
          type: 'error',
          emailId,
          email: email,
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
    emailId: {
      type: String
    },
    email: {
      type: Object
    },
    smtp: {
      type: Object
    }
  },
  async execute(event) {
    await SentEmail.create({ id: event.emailId, email: event.email, smtp: event.smtp })
  }
})


definition.event({
  name: "error",
  properties: {
    emailId: {
      type: String
    },
    email: {
      type: Object
    },
    error: {
      type: Object
    }
  },
  async execute(event) {
    await SentEmail.create({ id: event.emailId, email: event.email, error: event.error })
  }
})

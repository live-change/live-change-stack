import App from '@live-change/framework'
const app = App.app()
import { randomString } from '@live-change/uid'

const definition = app.createServiceDefinition({
  name: "secretLink"
})
const config = definition.config

const MessageAuthentication = definition.foreignModel('messageAuthentication', 'Authentication')

const targetProperties = {
  authentication: {
    type: MessageAuthentication,
    validation: ['nonEmpty']
  }
}

const secretProperties = {
  secretCode: {
    type: String,
    validation: ['nonEmpty']
  }
}

const Link = definition.model({
  name: "Link",
  properties: {
    ...targetProperties,
    ...secretProperties,
    expire: {
      type: Date,
      validation: ['nonEmpty']
    }
  },
  indexes: {
    bySecretCode: {
      property: 'secretCode'
    },
    byAuthentication: {
      property: 'authentication'
    }
  }
})

definition.event({
  name: 'linkCreated',
  execute({ link, authentication, secretCode, expire }) {
    return Link.create({ id: link, authentication, secretCode, expire })
  }
})

definition.event({
  name: 'linkExpired',
  execute({ link }) {
    return Link.update(link, { date: new Date(Date.now() - 1000) })
  }
})

definition.trigger({
  name: "authenticationSecret",
  properties: {
    ...targetProperties
  },
  waitForEvents: true,
  async execute({ authentication }, context, emit) {
    const link = app.generateUid()
    const secretCode = randomString(config.secretCodeLength || 16)
    const expire = new Date()
    expire.setTime(Date.now() + (config.expireTime || 24*60*60*1000))
    emit({
      type: 'linkCreated',
      link,
      authentication,
      secretCode, expire
    })
    return {
      type: 'link',
      link,
      expire,
      secret: {
        secretCode
      }
    }
  }
})

definition.trigger({
  name: "refreshAuthenticationSecret",
  properties: {
    ...targetProperties
  },
  waitForEvents: true,
  async execute({ authentication }, context, emit) {
    const currentLink = await Link.indexObjectGet('byAuthentication', authentication)
    if(currentLink) {
      emit({ type: 'linkExpired', link: currentLink.id })
    }
    const link = app.generateUid()
    const secretCode = randomString(config.secretCodeLength || 16)
    const expire = new Date()
    expire.setTime(Date.now() + (config.expireTime || 24*60*60*1000))
    emit({
      type: 'linkCreated',
      link,
      authentication,
      secretCode, expire
    })
    return {
      type: 'link',
      link,
      expire,
      secret: {
        secretCode
      }
    }
  }
})

definition.view({
  name: "link",
  properties: {
    ...secretProperties
  },
  daoPath({ secretCode }, { client, context }) {
    return Link.indexObjectPath('bySecretCode', secretCode)
  }
})

definition.trigger({
  name: "checkLinkSecret",
  properties: {
    secret: {
      type: String,
      validation: ['nonEmpty']
    }
  },
  async execute({ secret }, context, emit) {
    const linkData = await Link.indexObjectGet('bySecretCode', secret)
    if(!linkData) throw 'linkNotFound'
    if(new Date().toISOString() > linkData.expire) throw "linkExpired"
    return linkData.authentication
  }
})

export default definition

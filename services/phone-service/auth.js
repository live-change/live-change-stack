import App from '@live-change/framework'
const validation = App.validation
import definition from './definition.js'

const User = definition.foreignModel('user', 'User')
const Phone = definition.model({
  name: 'Phone',
  properties: {
    phone: {
      type: String,
      validation: ['nonEmpty', 'phone']
    }
  },
  userItem: {
    userReadAccess: () => true
  }
})

definition.view({
  name: "userPhones",
  global: true,
  internal: true,
  properties: {
    user: {
      type: String
    }
  },
  returns: {
    type: Object
  },
  async daoPath({ user }) {
    return Phone.indexRangePath('byUser', [user])
  }
})

definition.event({
  name: 'phoneConnected',
  properties: {
    phone: {
      type: String,
      validation: ['nonEmpty', 'phone']
    },
    user: {
      type: User,
      validation: ['nonEmpty']
    }
  },
  async execute({ user, phone }) {
    await Phone.create({
      id: phone,
      user, phone
    })
  }
})

definition.event({
  name: "phoneDisconnected",
  properties: {
    phone: {
      type: String,
      validation: ['nonEmpty', 'phone']
    },
    user: {
      type: User,
      validation: ['nonEmpty']
    }
  },
  async execute({ user, phone }) {
    await Phone.delete(phone)
  }
})

definition.event({
  name: "userDeleted",
  properties: {
    user: {
      type: User,
      validation: ['nonEmpty']
    }
  },
  async execute({ user }) {
    const phones = await Phone.indexRangeGet('byUser', user)
    await Promise.all(phones.map(phone => Phone.delete(phone)))
  }
})

definition.trigger({
  name: "checkNewPhone",
  properties: {
    phone: {
      type: String,
      validation: ['nonEmpty', 'phone']
    }
  },
  async execute({ phone }, context, emit) {
    const phoneData = await Phone.get(phone)
    if(phoneData) throw { properties: { phone: 'taken' } }
    return true
  }
})

definition.trigger({
  name: "getPhone",
  properties: {
    phone: {
      type: String,
      validation: ['nonEmpty', 'phone']
    }
  },
  async execute({ phone }, context, emit) {
    const phoneData = await Phone.get(phone)
    if(!phoneData) throw { properties: { phone: 'notFound' } }
    return phoneData
  }
})

definition.trigger({
  name: "getPhoneOrNull",
  properties: {
    phone: {
      type: String,
      validation: ['nonEmpty', 'phone']
    }
  },
  async execute({ phone }, context, emit) {
    const phoneData = await Phone.get(phone)
    return phoneData
  }
})

definition.trigger({
  name: "connectPhone",
  properties: {
    phone: {
      type: String,
      validation: ['nonEmpty', 'phone']
    },
    user: {
      type: User,
      validation: ['nonEmpty']
    }
  },
  async execute({ user, phone }, { service }, emit) {
    if(!phone) throw new Error("no phone")
    const phoneData = await Phone.get(phone)
    if(phoneData) throw { properties: { phone: 'taken' } }
    await service.trigger({ type: 'contactConnected' }, {
      contactType: 'phone_Phone',
      contact: phone,
      user
    })
    emit({
      type: 'phoneConnected',
      user, phone
    })
    return true
  }
})

definition.trigger({
  name: "disconnectPhone",
  properties: {
    phone: {
      type: String,
      validation: ['nonEmpty', 'phone']
    },
    user: {
      type: User,
      validation: ['nonEmpty']
    }
  },
  async execute({ user, phone }, { client, service }, emit) {
    const phoneData = await Phone.get(phone)
    if(!phoneData) throw { properties: { phone: 'notFound' } }
    if(phoneData.user !== user) throw { properties: { phone: 'notFound' } }
    emit({
      type: 'phoneDisconnected',
      user, phone
    })
    return true
  }
})

definition.trigger({
  name: "signInPhone",
  properties: {
    phone: {
      type: String
    }
  },
  waitForEvents: true,
  async execute({ phone, session }, { client, service }, emit) {
    const phoneData = await Phone.get(phone)
    if(!phoneData) throw { properties: { phone: 'notFound' } }
    const { user } = phoneData
    return service.trigger({ type: 'signIn' }, {
      user, session
    })
  }
})

definition.trigger({
  name: "getConnectedContacts",
  properties: {
    user: {
      type: User,
      validation: ['nonEmpty', 'phone']
    }
  },
  async execute({ user }, context, emit) {
    const phones = await Phone.indexRangeGet('byUser', user)
    return phones.map(phone => ({ ...phone, type: 'phone', contact: phone.phone }))
  }
})

definition.trigger({
  name: 'userDeleted',
  properties: {
    user: {
      type: User
    }
  },
  async execute({ user }, { service }, emit) {
    emit([{
      type: "userDeleted",
      user
    }])
  }
})

export { Phone }

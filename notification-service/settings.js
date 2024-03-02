import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
const config = definition.config

async function clientOwnsContact({ user }, { contactType, contact }) {
  console.log("ACC", user, contactType, contact)
  if(!user) return false
  const [service, model] = contactType.split('_')
  if(!config.contactTypes.includes(service)) return false
  const contactData = await app.dao.get(['database', 'tableObject', app.databaseName, contactType, contact ])
  return contactData.user == user
}

const NotificationSetting = definition.model({
  name: "NotificationSetting",
  propertyOfAny: {
    to: ['contact', 'notification'],
    readAccess: (params, {client, context, visibilityTest}) =>
        visibilityTest || clientOwnsContact(client, params),
    writeAccess: (params, {client, context, visibilityTest}) =>
        visibilityTest || clientOwnsContact(client, params)
  },
  properties: {
    active: Boolean,
    lastUpdate: { type: Date }
  }
})

export { NotificationSetting }

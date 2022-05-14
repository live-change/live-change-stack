const App = require("@live-change/framework")
const app = App.app()

const definition = require('./definition.js')
const config = definition.config

async function clientOwnsContact({ user }, { contactType, contact }) {
  console.log("ACC", user, contactType, contact)
  if(!user) return false
  const [service, model] = contactType.split('_')
  if(service[0].toUpperCase() + service.slice(1) != model) return false
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

module.exports = { NotificationSetting }
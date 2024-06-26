import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'
import { Session } from './model.js'
import { createHmac } from 'crypto'
const config = definition.config

definition.authenticator({
  async prepareCredentials(credentials) {
    const sessionKey = credentials.sessionKey
    if(!sessionKey) throw new Error("sessionKey required!")
    const sessions = await app.dao.get(
        ['database', 'indexRange', app.databaseName, Session.tableName + '_byKey', {
          gt: `"${sessionKey}"_`,
          lt: `"${sessionKey}"_\xFF`
        }])
    //console.log("FOUND SESSIONS", sessions)
    let session = sessions[0]?.to
    if(!session) {
      if(config.createSessionOnUpdate) {
        session = createHmac('sha256', config.sessionHmacSecret || 'secret')
            .update(credentials.sessionKey)
            .digest('base64').slice(0, 32).replace(/\//g, '_').replace(/\+/g, '-')
      } else {
        const createResult = await app.triggerService({ service: definition.name, type: "createSessionKeyIfNotExists" }, {
          sessionKey
        })
        //console.log("CREATE SESSION RESULT", createResult)
        session = createResult.session
      }
    }
    credentials.session = session
  }
})

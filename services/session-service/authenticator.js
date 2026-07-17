import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'
import { Session } from './model.js'
import { createHmac } from 'crypto'
const config = definition.config

definition.authenticator({
  name: 'session',
  async prepareCredentials(credentials) {
    const startedAt = Date.now()
    const sessionKey = credentials.sessionKey
    const sessionKeyPrefix = sessionKey && typeof sessionKey === 'string'
      ? sessionKey.slice(0, 8) + '…'
      : undefined
    let session = null
    let path = null
    try {
      if(!config.createSessionOnUpdate) {
        if(!sessionKey) throw new Error("sessionKey required!")
        const sessions = await app.dao.get(
            ['database', 'indexRange', app.databaseName, Session.tableName + '_byKey', {
              gt: `"${sessionKey}"_`,
              lt: `"${sessionKey}"_\xFF`
            }])
        //console.log("FOUND SESSIONS", sessions)
        session = sessions[0]?.to
        path = session ? 'lookup' : null
      }
      if(!session) {
        if(config.createSessionOnUpdate) {
          session = createHmac('sha256', config.sessionHmacSecret || 'secret')
              .update(credentials.sessionKey)
              .digest('base64').slice(0, 32).replace(/\//g, '_').replace(/\+/g, '-')
          path = 'hmac'
        } else {
          const createResult = await app.triggerService({ service: definition.name, type: "createSessionKeyIfNotExists" }, {
            sessionKey
          })
          //console.log("CREATE SESSION RESULT", createResult)
          session = createResult.session
          path = 'create'
        }
      }
      credentials.session = session
      const ms = Date.now() - startedAt
      if(ms > 200 || process.env.DEBUG_AUTH === '1' || process.env.DEBUG_AUTH === 'true') {
        console.log('[auth] prepareCredentials session done', {
          sessionKeyPrefix,
          session,
          ms,
          path
        })
      }
    } catch(error) {
      console.error('[auth] prepareCredentials session error', {
        sessionKeyPrefix,
        ms: Date.now() - startedAt,
        path,
        error
      })
      throw error
    }
  }
})

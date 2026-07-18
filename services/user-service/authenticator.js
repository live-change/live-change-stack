
import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'

import { User, AuthenticatedUser } from './model.js'

const SLOW_QUERY_MS = 500

definition.authenticator({
  name: 'user',
  async credentialsObservable(credentials) {    
    return app.dao.observable(
      ['database', 'queryObject', app.databaseName, `(${
        async (input, output, { session, authenticatedTableName, userTableName, slowQueryMs }) => {
          const queryId = (Math.random()*10000).toFixed(0)
          const ts = () => new Date().toISOString()
          //output.debug(ts(), queryId, 'STARTING USER AUTH QUERY', { session })
          const authenticatedTable = input.table(authenticatedTableName)
          const userTable = input.table(userTableName)
          let user = null
          let userObject = null
          let userObserver = null
          let oldCredentials = null
          await authenticatedTable.object(session).onChange(async (authData, oldAuthData) => {
            const newUser = authData ? authData.user : null
            //output.debug(ts(), queryId, "AUTH DATA CHANGE TO", authData, "FROM", oldAuthData, "NEW USER", newUser, "OLD USER", user)
            if(newUser === user) return
            //output.debug(ts(), queryId, "USER CHANGE", user, '=>', newUser)
            if(user) {
              if(userObject) {
                await userObject.unobserve(userObserver)
              }
              userObject = null
              userObserver = null
            }
            if(newUser) {
              user = newUser
              userObject = userTable.object(user)
              const currentUserObject = userObject
              //output.debug(ts(), queryId, "USER ON CHANGE START", { user })
              await userObject.onChange(async (userData, oldUserData) => {
                const newCredentials = userData ? {
                  id: user,
                  user,
                  roles: userData.roles
                } : null
                //output.debug("NEW CREDENTIALS", newCredentials)
                output.change(newCredentials, oldCredentials)
                oldCredentials = newCredentials
              }).then(observer => {
                if(user === newUser) {
                  userObserver = observer
                } else { // if user changed before observer loaded data
                  currentUserObject.unobserve(observer)
                }
              })
              //output.debug(ts(), queryId, "USER ON CHANGE END", { user })
            } else {
              //output.debug("USER NULL", user)
              //output.debug("OLD CREDENTIALS", oldCredentials)
              user = null
              output.change(null, oldCredentials)
              oldCredentials = null
            }
          })
          //output.debug(ts(), queryId, "AUTH DATA ON CHANGE END", { session })
          const ms = Date.now() - startedAt
          if(ms >= slowQueryMs) {
            output.debug('user auth query slow', { session, ms })
          }
        }
      })`, {
        session: credentials.session,
        authenticatedTableName: AuthenticatedUser.tableName,
        userTableName: User.tableName,
        slowQueryMs: SLOW_QUERY_MS
      }]
    )
  }
})

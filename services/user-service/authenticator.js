
import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'

import { User, AuthenticatedUser } from './model.js'

definition.authenticator({
  name: 'user',
  async credentialsObservable(credentials) {
    console.log('[auth] credentialsObservable start', {
      name: 'user',
      session: credentials.session,
      ip: credentials.ip
    })
    return app.dao.observable(
      ['database', 'queryObject', app.databaseName, `(${
        async (input, output, { session, authenticatedTableName, userTableName }) => {
          const authenticatedTable = input.table(authenticatedTableName)
          const userTable = input.table(userTableName)
          let user = null
          let userObject = null
          let userObserver = null
          let oldCredentials = null
          await authenticatedTable.object(session).onChange(async (authData, oldAuthData) => {
            output.debug("NEW USER AUTH", authData, "FROM", oldAuthData)
            const newUser = authData ? authData.user : null
            if(newUser === user) return
            output.debug("USER CHANGE", user, '=>', newUser)
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
              await userObject.onChange(async (userData, oldUserData) => {
                const newCredentials = userData ? {
                  id: user,
                  user,
                  roles: userData.roles
                } : null
                output.debug("NEW CREDENTIALS", newCredentials)
                output.change(newCredentials, oldCredentials)
                oldCredentials = newCredentials
              }).then(observer => {
                if(user === newUser) {
                  userObserver = observer
                } else { // if user changed before observer loaded data
                  currentUserObject.unobserve(observer)
                }
              })
            } else {
              output.debug("USER NULL", user)
              output.debug("OLD CREDENTIALS", oldCredentials)
              user = null
              output.change(null, oldCredentials)
              oldCredentials = null
            }
          })
        }
      })`, {
        session: credentials.session,
        authenticatedTableName: AuthenticatedUser.tableName,
        userTableName: User.tableName
      }]
    )
  }
})

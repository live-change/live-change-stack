const App = require('@live-change/framework')
const app = App.app()
const definition = require('./definition.js')

const { User, AuthenticatedUser } = require('./model.js')

definition.authenticator({
  async credentialsObservable(credentials) {
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
            const newUser = authData ? authData.user : null
            if(newUser == user) return
            if(user) {
              await userObject.unobserve(userObserver)
              userObject = null
              userObserver = null
            }
            if(authData.user) {
              user = newUser
              userObject = userTable.object(user)
              await userObject.onChange(async (userData, oldUserData) => {
                const newCredentials = userData ? {
                  id: user,
                  user,
                  roles: userData.roles
                } : null
                output.change(newCredentials, oldCredentials)
                oldCredentials = newCredentials
              }).then(observer => {
                if(user == newUser) {
                  userObserver = observer
                } else { // if user changed before observer loaded data
                  userObject.unobserve(observer)
                }
              })
            } else {
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

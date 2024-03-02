import App from '@live-change/framework'
const app = App.app()

import { OAuth2Client } from 'google-auth-library'

const googClientId = process.env.GOOGLE_CLIENT_ID
const googClient = new OAuth2Client(googClientId)

const definition = app.createServiceDefinition({
  name: "googleAuthentication",
  eventSourcing: true
})


const User = definition.foreignModel("users", "User")

const Login = definition.model({
  name: "Login",
  properties: {
    name: {
      type: String
    },
    id: {
      type: String
    },
    email: {
      type: String
    },
    user: {
      type: User
    }
  },
  indexes: {
    byUser: {
      property: "user"
    }
  },
  crud: {
    options: {
      access: (params, {client, service, visibilityTest}) => {
        return client.roles.includes('admin')
      }
    }
  }
})

definition.action({
  name: "registerOrLogin",
  properties: {
    accessToken: {
      type: String
    }
  },
  returns: {
    type: User,
    idOnly: true
  },
  async execute({ accessToken, userData: userDataParams }, { client, service }, emit) {
    const ticket = await googClient.verifyIdToken({
      idToken: accessToken,
      audience: googClientId
    })
    const googUser = ticket.getPayload()
    console.log("GOOGLE USER", googUser)
    const existingLogin = await Login.get(googUser.sub)
    if(existingLogin) { /// Login
      let userRow = await User.get(existingLogin.user)
      const user = existingLogin.user
      if(!userRow) throw new Error("internalServerError")
      emit("session", [{
        type: "loggedIn",
        user: existingLogin.user,
        session: client.sessionId,
        expire: null,
        roles: userRow.roles || []
      }])
      await service.trigger({
        type: "OnLogin",
        user,
        session: client.sessionId
      })
      return existingLogin.user
    } else { // Register
      const user = app.generateUid()
      console.log("PIC", googUser.picture)
      let userData = JSON.parse(JSON.stringify({
        name: googUser.name,
        email: googUser.email,
        firstName: googUser.given_name,
        lastName: googUser.family_name
      }))

      userData = { ...userDataParams, ...userData }

      await service.trigger({
        type:"OnRegisterStart",
        session: client.sessionId,
        user: user
      })

      emit("googleAuthentication", [{
        type: "LoginCreated",
        login: googUser.sub,
        data: {
          id: googUser.sub,
          user,
          ...userData
        }
      }])
      emit("users", [{
        type: "UserCreated",
        user,
        data: {
          userData,
          //display: await userDataDefinition.getDisplay({ userData })
          // TODO: add identification
        }
      },{
        type: "loginMethodAdded",
        user,
        method: {
          type: "google",
          id: googUser.sub,
          goog: googUser
        }
      }])
      await service.trigger({
        type:"OnRegister",
        session: client.sessionId,
        user: user,
        userData
      })
      emit("session", [{
        type: "loggedIn",
        user,
        session: client.sessionId,
        expire: null,
        roles: []
      }])
      await service.trigger({
        type: "OnLogin",
        user,
        session: client.sessionId
      })

      // Completly asynchronous
      service.triggerService('pictures',{
        type: "createPictureFromUrl",
        owner: user,
        name: "google-profile-picture",
        purpose: "users-updatePicture-picture",
        url: googUser.picture,
        cropped: true
      }).then(picture => {
        emit('users', [{
          type: "UserUpdated",
          user,
          data: {
            userData: {
              picture
            }
          }
        }])
      }).catch(e => {})


      return user
    }
  }

})

/*definition.action({
  name: "removeConnection", // override CRUD operation
  properties: {},
  returns: {
    type: User,
    idOnly: true
  },
  async execute({ }, { client, service }, emit) {
    if(!client.user) throw new new Error("notAuthorized")
    const user = client.user
    const results = await (service.dao.get(['database', 'query', service.databaseName, `(${
        async (input, output, { user }) =>
            await input.table("googleLogin_Login").onChange((obj, oldObj) => {
              if(obj && obj.user == user) output.put(obj)
            })
    })`, { user }]))
    if(results.length == 0) throw 'notFound'
    let events = []
    for(let row of results) {
      events.push({
        type: "LoginRemoved",
        login: row.id
      })
    }
    emit("facebookLogin", events)
  }
})*/

definition.event({
  name: "UserDeleted",
  properties: {
    user: {
      type: User
    }
  },
  async execute({ user }) {
    await app.dao.request(['database', 'query'], app.databaseName, `(${
        async (input, output, { table, index, user }) => {
          const prefix = `"${user}"_`
          await (await input.index(index)).range({
            gte: prefix,
            lte: prefix+"\xFF\xFF\xFF\xFF"
          }).onChange((ind, oldInd) => {
            if(ind && ind.to) {
              output.table(table).delete(ind.to)
            }
          })
        }
    })`, { table: Login.tableName, index: Login.tableName + '_byUser', user })
  }
})

definition.trigger({
  name: "UserDeleted",
  properties: {
    user: {
      type: User,
      idOnly: true
    }
  },
  async execute({ user }, context, emit) {
    emit([{
      type: "UserDeleted",
      user
    }])
  }
})


export default definition

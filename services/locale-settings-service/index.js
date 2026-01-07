import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'

const LocaleSettings = definition.model({
  name: 'LocaleSettings',
  sessionOrUserProperty: {
    globalView: true,
    ownerReadAccess: () => true,
    ownerWriteAccess: () => true,
  },
  properties: {
    language: {
      type: String
    },
    currency: {
      type: String
    },
    dateTime: {
      type: Object,
      default: undefined,
    },
    list: {
      type: Object,
      default: undefined,
    },
    number: {
      type: Object,
      default: undefined,
    },
    plural: {
      type: Object,
      default: undefined,
    },
    relativeTime: {
      type: Object,
      default: undefined,
    },
    capturedLanguage: {
      type: String
    },
    capturedCurrency: {
      type: String
    },
    capturedDateTime: {
      type: Object
    },
    capturedList: {
      type: Object
    },
    capturedNumber: {
      type: Object
    },
    capturedPlural: {
      type: Object
    },
    capturedRelativeTime: {
      type: Object
    }
  }
})

export { LocaleSettings }

const User = definition.foreignModel('user', 'User')
const Session = definition.foreignModel('session', 'Session')

definition.view({
  name: 'userOrSessionLocaleSettings',
  access: ['admin'],
  properties: {
    user: {
      type: User
    },
    session: {
      type: Session
    }
  },
  daoPath({ user, session }, { client, context }) {
    if(!user && !session) return null
    if(user && !session) return LocaleSettings.path(
      ['user_User', user].map(p => JSON.stringify(p)).join(':')
    )
    if(!user && session) return LocaleSettings.path(
      ['session_Session', session].map(p => JSON.stringify(p)).join(':')
    )
    
    return ['database', 'queryObject', app.databaseName, `(${
      async (input, output, { user, session, localeSettingsTableName }) => {
        const localeSettingsTable = input.table(localeSettingsTableName)
        const userObject = localeSettingsTable.object(
          ['user_User', user].map(p => JSON.stringify(p)).join(':')
        )
        const sessionObject = localeSettingsTable.object(
          ['session_Session', session].map(p => JSON.stringify(p)).join(':')
        )
        let userLocaleSettings = {}
        let sessionLocaleSettings = {}        
        let oldResult = null
        let loaded = false
        async function updateResult() {
          // mix values from user and session locale settings          
          const result = { ...sessionLocaleSettings, ...userLocaleSettings }
          output.debug("USER LOCALE SETTINGS", userLocaleSettings)
          output.debug("SESSION LOCALE SETTINGS", sessionLocaleSettings)
          output.debug("RESULT LOCALE SETTINGS", result)
          await output.change(result, oldResult)
          oldResult = result
        }
        await sessionObject.onChange(async (obj, oldObj) => {
          sessionLocaleSettings = obj
          if(loaded) await updateResult()
        })
        await userObject.onChange(async (obj, oldObj) => {
          userLocaleSettings = obj
          if(loaded) await updateResult()
        })
        loaded = true
        await updateResult()
      }
    })`, { user, session, localeSettingsTableName: LocaleSettings.tableName }]
  }
})

export default definition

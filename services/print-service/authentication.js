import config from './config.js'
import definition from './definition.js'

import { ObservableValue } from '@live-change/dao'

const authenticationKey = new ObservableValue(
  config.printAuthenticationKey
)

definition.authenticator({
  async prepareCredentials(credentials) {
    //console.log("PRINT AUTHENTICATOR", credentials, authenticationKey.getValue())
    if(credentials.sessionKey === authenticationKey.getValue()) {
      credentials.roles.push('admin')
      credentials.internal = true
    }
  }
})

const baseUrl = `http://${config.ssrHost}`+`:${config.ssrPort}`

export async function getAuthenticatedUrl(path, data) {
  const encodedData = data && encodeURIComponent(JSON.stringify(data))
  return baseUrl + path + (data ? '/' + encodedData : '') +`?sessionKey=${await authenticationKey.getValue()}`
}

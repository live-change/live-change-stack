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

export async function getAuthenticatedUrl(path, data) {
  const baseUrl = config.ssrUrl || process.env.SSR_URL || 'http://localhost:8001'
  const encodedData = data && encodeURIComponent(JSON.stringify(data))
  return baseUrl + path + (data ? '/' + encodedData : '') +`?sessionKey=${await authenticationKey.getValue()}`
}

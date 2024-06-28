export function getAuthorizationUri(config) {
  const {
    authorizationBase = 'https://accounts.google.com/o/oauth2/auth',
    accessType = 'offline',
    approvalPrompt = 'force',
    scope,
    responseType = 'code',
    clientId = ENV_GOOGLE_CLIENT_ID,
    redirectUri = 'urn:ietf:wg:oauth:2.0:oob',
  } = config

  const authorizationUri = authorizationBase +
    `?access_type=${accessType}&approval_prompt=${approvalPrompt}` +
    `&scope=${encodeURIComponent(scope)}&response_type=${responseType}`+
    `&client_id=${encodeURIComponent(clientId)}`+
    //`&state=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}`

  return authorizationUri
}

export function googleAuthRedirect(opts) {
  const authUri = getAuthorizationUri({
    ...opts
  })
  console.log("AUTH URI", authUri)

  setTimeout(() => window.location = authUri, 100)
}
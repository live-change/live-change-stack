export function getAuthorizationUri(config) {
  const {
    authorizationBase = 'https://accounts.google.com/o/oauth2/auth',
    accessType = 'online',
    approvalPrompt = 'force',
    scope,
    responseType = 'code',
    includeGrantedScopes = true,
    clientId,
    redirectUri = 'urn:ietf:wg:oauth:2.0:oob',
  } = config

  const authorizationUri = authorizationBase +
    `?access_type=${accessType}&approval_prompt=${approvalPrompt}` +
    `&scope=${encodeURIComponent(scope)}&response_type=${responseType}`+
    (includeGrantedScopes ? `&include_granted_scopes=true` : '') +
    `&client_id=${encodeURIComponent(clientId)}`+
    //`&state=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}`

  console.log("auth config", config)
  console.log("AUTH URI", authorizationUri)

  return authorizationUri
}

export function googleAuthRedirect(opts) {
  const authUri = getAuthorizationUri({
    ...opts
  })
  console.log("AUTH URI", authUri)

  setTimeout(() => window.location = authUri, 100)
}
export function getAuthorizationUri(config) {
  const {
    authorizationBase = 'https://www.linkedin.com/oauth/v2/authorization',
    accessType = 'offline',
    approvalPrompt = 'force',
    scope,
    responseType = 'code',
    clientId,
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

export function linkedinAuthRedirect(opts) {
  const authUri = getAuthorizationUri({
    ...opts
  })
  console.log("AUTH URI", authUri)

  setTimeout(() => window.location = authUri, 100)
}
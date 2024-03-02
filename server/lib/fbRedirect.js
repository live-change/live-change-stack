function isAppSpecificUserAgent(userAgent) {
  if(!userAgent) return false
  const appSpecificUserAgents = ["FBAN", "FBAV"]
  for (let i = 0; i <= appSpecificUserAgents.length; i++) {
    if (userAgent.indexOf(appSpecificUserAgents[i]) > -1) return true
  }
}
function isIOs(userAgent) {
  if(!userAgent) return false
  const iOsUserAgents = ["iPad", "iPhone", "iPod"]
  for (let i = 0; i <= iOsUserAgents.length; i++) {
    if (userAgent.indexOf(iOsUserAgents[i]) > -1) return true
  }
}

function fbRedirect(req, res) {
  const userAgent = req.get('user-agent')
  if(isAppSpecificUserAgent(userAgent)) {
    const redirectUrl = (process.env.BASE_HREF || `${req.header('host')}`) + req.url
    console.log("REDIRECTING FB MESSENGER TO", redirectUrl)
    if(!isIOs(userAgent)) {
      res.redirect(302, "googlechrome://navigate?url=https://"+redirectUrl)
      res.end("facebook messanger internal browser is not supported")
      return true
    } else {
      console.log("FACEBOOK MESSENGER ON iOS DOES NOT ALLOW REDIRECT TO BROWSER")
      /*res.redirect(302, "googlechromes://"+redirectUrl)
      res.end("facebook messanger internal browser is not supported")*/
    }
  }
}

export {
  isAppSpecificUserAgent,
  isIOs,
  fbRedirect
}
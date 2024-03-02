const App = require('@live-change/framework')
const app = App.app()

const randomProfile = require('random-profile-generator')
const passwordGenerator = require('generate-password')

const steps = {

  async haveUser(name, email, password, user = app.generateUid(), roles = []) {
    const I = this

    if(!password) password = passwordGenerator.generate({
      length: 10,
      numbers: true
    })
    if(!name) {
      name = randomProfile.profile().firstName
    }
    if(!email) {
      email = name.split(' ')[0].toLowerCase() + (Math.random()*100).toFixed() + '@test.com'
    }

    const PasswordAuthentication = await I.haveModel("passwordAuthentication", "PasswordAuthentication")
    const User = await I.haveModel("user", "User")
    const Email = await I.haveModel("email", "Email")
    const Identification = await I.haveModel("userIdentification", "Identification")

    const passwordHash = PasswordAuthentication.definition.properties.passwordHash.preFilter(password)
    await User.create({ id: user, roles })
    await PasswordAuthentication.create({ id: user, user, passwordHash })
    await Email.create({ id: email, email, user })
    await Identification.create({
      id: App.encodeIdentifier(['user_User', user]), sessionOrUserType: 'user_User', sessionOrUser: user,
      name
    })
    return {
      id: user,
      name,
      email,
      password
    }
  },

  async useEmailLink(email, prefix = '/link/') {
    const I = this
    const MessageAuthentication = await I.haveModel('messageAuthentication', 'Authentication')
    const authentication =
      await MessageAuthentication.indexObjectGet('byContact', ['email', email], { reverse: true, limit: 1 })
    const Link = await I.haveModel('secretLink', 'Link')
    let link = await Link.indexObjectGet('byAuthentication', authentication)
    I.amOnPage(prefix + link.secretCode)
    await I.wait(0.1)
    return { authentication, link }
  },

  async amLoggedIn(user) {
    const I = this
    console.log("USER", user)
    const AuthenticatedUser = await I.haveModel("user", "AuthenticatedUser")
    const session = await I.executeScript(() => window.api.client.value.session)
    console.log("AUTHENTICATE SESSION", session)
    await AuthenticatedUser.create({ id: session, session, user: user.id })
  },

  async amLoggedOut() {
    const I = this
    const AuthenticatedUser = await I.haveModel("user", "AuthenticatedUser")
    const session = await I.executeScript(() => window.api.client.value.session)
    await AuthenticatedUser.delete(session)
  },

  async useSecretCode(authentication, happyPath) {
    const I = this
    const Code = await I.haveModel('secretCode', 'Code')
    let codeData = await Code.indexObjectGet('byAuthentication', authentication)
    console.log("CODE DATA", codeData)
    I.assert(!!codeData, true, 'code created')

    if(!happyPath) {
      const wrongCode = codeData.secretCode == '123456' ? '654321' : '123456'
      I.fillField('input#code', wrongCode)
      I.fillField('input#code', wrongCode) /// twice because it can fail once with this type of field
      I.click('button[type=submit]')
      I.seeElement('#code-help.p-error')
    }

    if(!happyPath) {
      await I.wait(0.2)
      await Code.update(codeData.id, { expire: new Date() }) // expire now
      I.fillField('input#code', codeData.secretCode)
      I.fillField('input#code', codeData.secretCode) /// twice because it can fail once with this type of field
      I.click('button[type=submit]')
      I.seeElement('#code-help.p-error')

      I.click('Resend')
      I.seeInCurrentUrl('/sent/')

      await I.wait(0.2)
      const newCodeData = await Code.indexRangeGet('byAuthentication', authentication)
      newCodeData.sort((a,b) => new Date(b.expire).getTime() - new Date(a.expire).getTime())
      const oldCodeData = codeData
      codeData = newCodeData[0]
      I.assert(!!codeData, true, 'code exists')
      I.assert(oldCodeData.id != codeData.id, true, 'code is different from previous code')
    }

    I.fillField('input#code', codeData.secretCode)
    I.fillField('input#code', codeData.secretCode) /// twice because it can fail once with this type of field
    I.click('button[type=submit]')
    await I.wait(0.1)
  },

  async useSecretLink(authentication, happyPath, prefix = '') {
    const I = this
    const Link = await I.haveModel('secretLink', 'Link')
    let linkData = await Link.indexObjectGet('byAuthentication', authentication)
    console.log("LINK DATA", linkData)
    I.assert(!!linkData, true, 'link created')

    if(!happyPath) {
      I.amOnPage(prefix + '/link/[badSecret]')
      I.see('Unknown link')
    }

    if(!happyPath) {
      await I.wait(0.2)
      await Link.update(linkData.id, { expire: new Date() }) // expire now
      I.amOnPage(prefix + '/link/' + linkData.secretCode)
      I.see('Link expired')

      I.click('Resend')
      I.seeInCurrentUrl(prefix + '/sent/')

      await I.wait(0.2)
      const newLinksData = await Link.indexRangeGet('byAuthentication', authentication)
      newLinksData.sort((a,b) => new Date(b.expire).getTime() - new Date(a.expire).getTime())
      const oldLinkData = linkData
      linkData = newLinksData[0]
      I.assert(!!linkData, true, 'link exists')
      I.assert(oldLinkData.id != linkData.id, true, 'link is different from previous link')
    }

    console.log("LINK RIGHT", prefix + '/link/' + linkData.secretCode)
    I.amOnPage(prefix + '/link/'+linkData.secretCode)
    await I.wait(0.1)

    return linkData
  }

}

module.exports = function() {
  return actor(steps)
}

module.exports.steps = steps

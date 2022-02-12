// in this file you can append custom step methods to 'I' object

module.exports = function() {
  return actor({

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

    async useSecretLink(authentication, happyPath) {
      const I = this
      const Link = await I.haveModel('secretLink', 'Link')
      let linkData = await Link.indexObjectGet('byAuthentication', authentication)
      console.log("LINK DATA", linkData)
      I.assert(!!linkData, true, 'link created')

      if(!happyPath) {
        I.amOnPage('/link/[badSecret]')
        I.see('Unknown link')
      }

      if(!happyPath) {
        await I.wait(0.2)
        await Link.update(linkData.id, { expire: new Date() }) // expire now
        I.amOnPage('/link/' + linkData.secretCode)
        I.see('Link expired')

        I.click('Resend')
        I.seeInCurrentUrl('/sent/')

        await I.wait(0.2)
        const newLinksData = await Link.indexRangeGet('byAuthentication', authentication)
        newLinksData.sort((a,b) => new Date(b.expire).getTime() - new Date(a.expire).getTime())
        const oldLinkData = linkData
        linkData = newLinksData[0]
        I.assert(!!linkData, true, 'link exists')
        I.assert(oldLinkData.id != linkData.id, true, 'link is different from previous link')
      }

      console.log("LINK RIGHT", '/link/' + linkData.secretCode)
      I.amOnPage('/link/'+linkData.secretCode)
      await I.wait(0.1)

      return linkData
    }

  })
}

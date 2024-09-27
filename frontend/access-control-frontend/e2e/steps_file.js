const App = require('@live-change/framework')
const app = App.app()

const userSteps = require('../../user-frontend/e2e/steps_file.js').steps

const steps = {

  ...userSteps,

  async haveUserWithAccess(user, objectType, object, roles = ['admin']) {
    const I = this
    const Access = await I.haveModel('accessControl', 'Access')
    await Access.create({
      id: App.encodeIdentifier(['user_User', user.id, 'example_Example', 'one']),
      sessionOrUserType: 'user_User', sessionOrUser: user.id,
      objectType: 'example_Example', object: 'one',
      roles
    })
  }

}

module.exports = function() {
  return actor(steps)
}

module.exports.steps = steps


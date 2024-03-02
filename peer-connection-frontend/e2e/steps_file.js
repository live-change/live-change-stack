// in this file you can append custom step methods to 'I' object

const userSteps = require('../../user-frontend/e2e/steps_file.js')

module.exports = function() {
  return actor({

    ...userSteps

  })
}

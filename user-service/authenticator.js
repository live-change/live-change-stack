const App = require('@live-change/framework')
const app = App.app()
const definition = require('./definition.js')

definition.authenticator({
  async credentialsObservable(credentials) {

  }
})

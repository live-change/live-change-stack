import ReactiveDao from "@live-change/dao"
import ReactiveSockJS from "@live-change/dao-sockjs"
import Vue from 'vue'

import guid from "./guid.js"

let sessionId = localStorage.sessionId
if(!sessionId) {
  sessionId = guid()
  localStorage.sessionId = sessionId
}
document.cookie = `sessionId=${sessionId}`

let api =  new ReactiveDao(sessionId, {

  remoteUrl: document.location.protocol + '//' + document.location.host + "/api/sockjs",

  protocols: {
    'sockjs': ReactiveSockJS
  },

  connectionSettings: {
    queueRequestsWhenDisconnected: true,
    requestSendTimeout: 2300,
    requestTimeout: 10000,
    queueActiveRequestsOnDisconnect: false,
    autoReconnectDelay: 200,
    logLevel: 1,
    /*connectionMonitorFactory: (connection) =>
        new ReactiveDao.ConnectionMonitorPinger(connection, {
          pingInterval: 50,
          pongInterval: 200
        })*/
  },

  database: {
    type: "remote",
    generator: ReactiveDao.ObservableList
  }

})

import ReactiveDaoVue from '@live-change/dao-vue'
Vue.use(ReactiveDaoVue, {
  dao: api
})

api.command = function(method, args) {
  const _commandId = args._commandId || guid()
  console.trace("COMMAND "+_commandId+":"+JSON.stringify(method))
  return api.request(method, { ...args, _commandId })
}

api.guid = guid

window.api = api

export default api

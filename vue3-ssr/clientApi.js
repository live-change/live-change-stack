import { createReactiveObject } from '@live-change/vue3-components'
import * as lcdao from '@live-change/dao'
import { reactiveMixin, reactivePrefetchMixin, ReactiveObservableList } from '@live-change/dao-vue3'
import SockJsConnection from '@live-change/dao-sockjs'
import MessageConnection from '@live-change/dao-message'
import Api from "./Api.js"

function clientApi(settings = {}) {
  let credentials = window.__DAO_CACHE__ ? window.__CREDENTIALS__ : undefined
  if(settings.credentials) {
    credentials = {
      ...credentials,
      ...(typeof settings.credentials == 'function' ? settings.credentials(credentials) : settings.credentials)
    }
  }
  const local = {}
  for(const key in settings.local) {
    local[key] = {
      type: 'local',
      source: settings.local[key]
    }
  }

  const remote = {}
  for(const key in settings.remote) {
    remote[key] = settings.remote[key]
  }

  for(const key in settings.worker) {
    remote[key] = {
      type: 'remote',
      url: key,
      protocol: 'message',
      settings: {
        target: settings.worker[key]
      }
    }
  }

  const dao = new lcdao.Dao(credentials, {
    remoteUrl: settings.remoteUrl || document.location.protocol + '//' + document.location.host + "/api/sockjs",
    protocols: {
      'sockjs': SockJsConnection,
      'message': MessageConnection
    },

    ...local,
    ...remote,

    connectionSettings: {
      fastAuth: (!settings.credentials && window.hasOwnProperty('__DAO_CACHE__'))
        && !window.hasOwnProperty('__CREDENTIALS__'),

      queueRequestsWhenDisconnected: true,
      requestSendTimeout: Infinity,
      requestTimeout: Infinity,
      queueActiveRequestsOnDisconnect: true,
      autoReconnectDelay: 200,
      logLevel: 1,
      /*connectionMonitorFactory: (connection) =>
          new ReactiveDao.ConnectionMonitorPinger(connection, {
            pingInterval: 50,
            pongInterval: 200
          })*/

      ...(settings && settings.connectionSettings)
    },

    defaultRoute: {
      type: "remote",
      generator: ReactiveObservableList,
      ...settings.defaultRoute
    }
  })

  const api = new Api(dao)
  api.setup({
    ssr: (typeof window == "undefined") || !!window.__DAO_CACHE__,
    cache: true,
    ...settings,
    createReactiveObject(definition) {
      //console.log("CREATE REACTIVE OBJECT", definition)
      return createReactiveObject(definition, reactiveMixin(api), reactivePrefetchMixin(api) )
    }
  })
  for(const plugin of (settings.use || [])) {
    plugin(api)
  }
  if(!!window.__DAO_CACHE__) {
    api.generateServicesApi()
  }

  return api
}

export { clientApi }

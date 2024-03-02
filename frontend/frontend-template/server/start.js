import appConfig from './app.config.js'

import * as services from './services.list.js'
for(const serviceConfig of appConfig.services) {
  serviceConfig.module = services[serviceConfig.name]
}
appConfig.init = services['init']

import { starter } from '@live-change/cli'

starter(appConfig)

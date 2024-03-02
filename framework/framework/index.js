import App from './lib/App.js'

App.app = () => {
  if(!globalThis.liveChangeFrameworkApp) {
    globalThis.liveChangeFrameworkApp = new App()
  }
  return globalThis.liveChangeFrameworkApp
}

import * as utils from './lib/utils.js'
import * as validation from './lib/utils/validation.js'

App.utils = utils
App.validation = validation
App.rangeProperties = utils.rangeProperties
App.encodeIdentifier = utils.encodeIdentifier
App.extractRange = utils.extractRange
App.isomorphic = utils.isomorphic

export default App

import ActionDefinition from './lib/definition/ActionDefinition.js'
import EventDefinition from './lib/definition/EventDefinition.js'
import ForeignIndexDefinition from './lib/definition/ForeignIndexDefinition.js'
import ForeignModelDefinition from './lib/definition/ForeignModelDefinition.js'
import IndexDefinition from './lib/definition/IndexDefinition.js'
import ModelDefinition from './lib/definition/ModelDefinition.js'
import PropertyDefinition from './lib/definition/PropertyDefinition.js'
import ServiceDefinition from './lib/definition/ServiceDefinition.js'
import TriggerDefinition from './lib/definition/TriggerDefinition.js'
import ViewDefinition from './lib/definition/ViewDefinition.js'

export {
  ActionDefinition,
  EventDefinition,
  ForeignIndexDefinition,
  ForeignModelDefinition,
  IndexDefinition,
  ModelDefinition,
  PropertyDefinition,
  ServiceDefinition,
  TriggerDefinition,
  ViewDefinition
}

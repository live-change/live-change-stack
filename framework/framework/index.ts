import App from './lib/App.js'

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

// Export all types from definition files
export type { ActionDefinitionSpecification } from './lib/definition/ActionDefinition.js'
export type { EventDefinitionSpecification } from './lib/definition/EventDefinition.js'
export type { IndexDefinitionSpecification } from './lib/definition/IndexDefinition.js'
export type { ModelDefinitionSpecification, ModelIndexDefinitionSpecification, ModelPropertyDefinitionSpecification } from './lib/definition/ModelDefinition.js'
export type { PropertyDefinitionSpecification, ValidationSpecification, ValidationSpecificationObject } from './lib/definition/PropertyDefinition.js'
export type { ViewDefinitionSpecification, ViewDefinitionSpecificationBase, ViewDefinitionSpecificationObservable, ViewDefinitionSpecificationDaoPath, ViewDefinitionSpecificationFetch } from './lib/definition/ViewDefinition.js'
export type { TriggerDefinitionSpecification } from './lib/definition/TriggerDefinition.js'
export type { ClientContext, ContextBase, ViewContext, ActionContext } from './lib/definition/types.js'
export type { ServiceDefinitionSpecification } from './lib/definition/ServiceDefinition.js'
export type { AccessSpecification, AccessFunction } from './lib/processors/accessMethod.js'
export type { EventDefinitionSpecification as EventDefinitionSpecificationAC } from './lib/definition/EventDefinition.js'
export type * from './lib/definition/types.js'
import entity from './entity.js'

import propertyOf, { PropertyOfConfig } from './propertyOf.js'
import itemOf, { ItemOfConfig } from './itemOf.js'

import propertyOfAny, { PropertyOfAnyConfig } from './propertyOfAny.js'
import itemOfAny, { ItemOfAnyConfig } from './itemOfAny.js'

import relatedTo, { RelatedToConfig } from './relatedTo.js'
import relatedToAny, { RelatedToAnyConfig } from './relatedToAny.js'

import boundTo, { BoundToConfig } from './boundTo.js'
import boundToAny, { BoundToAnyConfig } from './boundToAny.js'
import saveAuthor from './saveAuthor.js'
import { ModelDefinitionSpecificationWithAccessControl } from './types.js'
import { SaveAuthorConfig } from './saveAuthor.js'

const processors = [
  entity,
  propertyOf, itemOf,
  propertyOfAny, itemOfAny,
  relatedTo, relatedToAny,
  boundTo, boundToAny,
  saveAuthor
]

const plugin = function(app, services) {
  app.defaultProcessors.push(...processors)
}
plugin.processors = processors

export default plugin

export { processors }

export interface MotelWithRelations extends ModelDefinitionSpecificationWithAccessControl {
  propertyOf: PropertyOfConfig
  itemOf: ItemOfConfig
  propertyOfAny: PropertyOfAnyConfig
  itemOfAny: ItemOfAnyConfig
  relatedTo: RelatedToConfig
  relatedToAny: RelatedToAnyConfig
  boundTo: BoundToConfig
  boundToAny: BoundToAnyConfig
  saveAuthor: SaveAuthorConfig        
}

export type { 
  PropertyOfConfig, ItemOfConfig, PropertyOfAnyConfig, ItemOfAnyConfig,
  RelatedToConfig, RelatedToAnyConfig, BoundToConfig, BoundToAnyConfig, 
  SaveAuthorConfig
} 


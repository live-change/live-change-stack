import entity from './entity.js'

import propertyOf from './propertyOf.js'
import itemOf from './itemOf.js'

import propertyOfAny from './propertyOfAny.js'
import itemOfAny from './itemOfAny.js'

import relatedTo from './relatedTo.js'
import relatedToAny from './relatedToAny.js'

import boundTo from './boundTo.js'
import boundToAny from './boundToAny.js'
import saveAuthor from './saveAuthor.js'


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

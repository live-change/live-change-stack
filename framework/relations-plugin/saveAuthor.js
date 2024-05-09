import { defineAuthorProperties } from './utils.js'

export default function(service, app) {
  for(let modelName in service.models) {
    const model = service.models[modelName]
    if(model.saveAuthor) {
      model.properties = {
        ...model.properties,
        ...defineAuthorProperties()
      }
    }
  }
}
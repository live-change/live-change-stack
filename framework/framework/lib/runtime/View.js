import LcDao from '@live-change/dao'

import { prepareParameters, processReturn } from "./params.js"

class View {
  constructor(definition, service) {
    this.service = service
    this.definition = definition
    this.name = definition.name
  }

  async observable(parameters, clientData) {
    const context = {
      service: this.service, client: clientData
    }
    const preparedParameters = await prepareParameters(parameters, this.definition.properties, this.service)
    const observable = this.definition.observable(preparedParameters, context)
    if(observable === null) return new LcDao.ObservableValue(null)
    return observable
  }

  async get(parameters, clientData) {
    const context = {
      service: this.service, client: clientData
    }
    const preparedParameters = await prepareParameters(parameters, this.definition.properties, this.service)
    if(!this.definition.get) throw new Error(`get method undefined in view ${this.service.name}/${this.name}`)
    return this.definition.get(preparedParameters, context)
  }
}

export default View

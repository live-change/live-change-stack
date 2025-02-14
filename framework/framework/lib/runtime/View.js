import LcDao from '@live-change/dao'

import { prepareParameters, processReturn } from "./params.js"

class View {
  constructor(definition, service) {
    this.service = service
    this.definition = definition
    this.name = definition.name
  }

  async observable(parameters, clientData) {
    if(this.definition.remote) {
      if(clientData?.ignoreRemoteView) {
        return this.service.app.serviceViewObservable(this.service.name, this.name, {
          ...parameters,
          ___forwardedClientData: clientData
        })
      } else if(!this.definition.internal) {
        clientData = parameters.___forwardedClientData ?? clientData
      }
    }
    const context = {
      service: this.service, client: clientData
    }
    const preparedParameters = await prepareParameters(parameters, this.definition.properties, this.service)
    try {
      const observable = this.definition.observable(preparedParameters, context)
      if(observable === null) return new LcDao.ObservableValue(null)
      return observable
    } catch(error) {
      console.error("VIEW", this.service.name, ".", this.definition.name,
        "OBSERVABLE", this.definition.observable, "ERROR", error)
      throw error
    }
  }

  async get(parameters, clientData) {
    if(this.definition.remote) {
      if(clientData?.ignoreRemoteView) {
        return this.service.app.serviceViewGet(this.service.name, this.name, {
          ...parameters,
          ___forwardedClientData: clientData
        })
      } else if(!this.definition.internal) {
        clientData = parameters.___forwardedClientData ?? clientData
      }
    }
    const context = {
      service: this.service, client: clientData
    }
    const preparedParameters = await prepareParameters(parameters, this.definition.properties, this.service)
    if(!this.definition.get) throw new Error(`get method undefined in view ${this.service.name}/${this.name}`)
    return this.definition.get(preparedParameters, context)
  }
}

export default View

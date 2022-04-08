const { prepareParameters, processReturn } = require("./params.js")

class TriggerHandler {

  constructor(definition, service) {
    this.definition = definition
    this.service = service
  }

  async executeSingleTrigger(definition, parameters, emit) {
    //console.log("PARAMETERS", JSON.stringify(parameters), "DEFN", this.definition.properties)
    const preparedParams = await prepareParameters(parameters, definition.properties, this.service)
    //console.log("PREP PARAMS", preparedParams)

    let resultPromise = definition.execute({
      ...preparedParams
    }, {
      action: this,
      service: this.service,
      trigger: (...args) => this.service.trigger(...args) /// TODO: collect call traces
    }, emit)

    resultPromise = resultPromise.then(async result => {
      const processedResult = await processReturn(result, definition.returns, this.service)
      return processedResult
    })
    resultPromise.catch(error => {
      console.error(`Trigger ${definition.name} error `, error)
    })
    return resultPromise
  }

  async execute(parameters, emit) {
    const resultsPromises = this.definition.map(defn => this.executeSingleTrigger(defn, parameters, emit))
    const results = await Promise.all(resultsPromises)
    return results
  }

}

module.exports = TriggerHandler
const utils = require("../utils.js")

class ForeignModelDefinition {

  constructor(serviceName, modelName) {
    this.serviceName = serviceName
    this.name = modelName
  }

  getTypeName() {
    return this.serviceName+':'+this.name
  }

  toJSON() {
    return {
      serviceName: this.serviceName,
      modelName: this.name
    }
  }

}

module.exports = ForeignModelDefinition

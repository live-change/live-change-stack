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

export default ForeignModelDefinition

class ForeignModelDefinition {
  serviceName: string
  name: string

  constructor(serviceName: string, modelName: string) {
    this.serviceName = serviceName
    this.name = modelName
  }

  getTypeName() {
    return this.serviceName+'_'+this.name
  }

  toJSON() {
    return {
      serviceName: this.serviceName,
      modelName: this.name
    }
  }

  $_toQueryDescription() {
    return `[ForeignModel ${this.serviceName}.${this.name}]`
  }

  toString() {
    return this.$_toQueryDescription()
  }

}

export default ForeignModelDefinition

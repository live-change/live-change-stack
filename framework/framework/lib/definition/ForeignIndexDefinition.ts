class ForeignIndexDefinition {
  serviceName: string
  indexName: string

  constructor(serviceName: string, indexName: string) {
    this.serviceName = serviceName
    this.indexName = indexName
  }

  toJSON() {
    return {
      serviceName: this.serviceName,
      indexName: this.indexName
    }
  }

}

export default ForeignIndexDefinition

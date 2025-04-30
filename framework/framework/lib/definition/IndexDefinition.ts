
export interface IndexDefinitionSpecification {
  name: string
  properties: Record<string, PropertyDefinition>
  function: (...args: any[]) => any
  search: boolean
  storage: any
  multi: boolean,
}

class IndexDefinition<T extends IndexDefinitionSpecification> {
  [key: string]: any

  constructor(definition: T) {
    this.properties = {}
    // @ts-ignore
    for(let key in definition) this[key] = definition[key]
  }

  toJSON() {
    return {
      ... this,
      function: `${this.function}`
    }
  }

  computeChanges( oldIndexParam ) {
    let oldIndex = JSON.parse(JSON.stringify(oldIndexParam))
    oldIndex.indexes = oldIndex.indexes || {}
    let changes: Record<string, any>[] = []
    if(oldIndex.function !== `${this.function}`) {
      changes.push({ operation: "deleteIndex", name: this.name })
      changes.push({ operation: "createIndex", name: this.name, index: this.toJSON() })
    }
    if(oldIndex.search && !this.search) changes.push({ operation: "indexSearchDisabled", index: this.name })
    if(!oldIndex.search && this.search) changes.push({ operation: "indexSearchEnabled", index: this.name })
    if(oldIndex.search && this.search && JSON.stringify(oldIndex.search) !== JSON.stringify(this.search))
      changes.push({ operation: "indexSearchUpdated", index: this.name })

    const oldStorage = oldIndex.storage || {}
    const newStorage = this.storage || {}
    if(JSON.stringify(oldStorage) !== JSON.stringify(newStorage)) {
      changes.push({ operation: "indexStorageChanged", index: this.name, oldStorage, storage: newStorage })
    }

    return changes
  }

}

export default IndexDefinition

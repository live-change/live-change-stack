export interface MigrationContext {
  dao: any
  database: string
  serviceName: string
  app: any
}

export interface MigrationDefinitionSpecification {
  name: string
  run: (context: MigrationContext) => Promise<void>
}

class MigrationDefinition<T extends MigrationDefinitionSpecification> {
  [key: string]: any

  constructor(definition: T) {
    // @ts-ignore
    for (const key in definition) this[key] = definition[key]
    if (!this.name) throw new Error('migration name is required')
    if (typeof this.run !== 'function') throw new Error('migration run function is required')
  }

  toJSON() {
    return {
      name: this.name
    }
  }
}

export default MigrationDefinition

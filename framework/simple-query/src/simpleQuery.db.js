async function simpleQuery(input, output, { _query, ...params }) {

  const plan = _query.plan
  const idFunction = idFunction && eval(`(${_query.idFunction})`)

  function sourceChangeStream(source, by) {
    if(typeof by === 'string') return source.object(by)
    if(Array.isArray(by)) return source.object(serializeKey(by))
    return source.range(by)
  }

  function objectPath(object, path) {
    return path.reduce((acc, path) => acc?.[path], object)
  }

  function decodeParameter(parameter, context, properties) {
    if(typeof parameter !== 'object') return parameter
    if(Array.isArray(parameter)) return parameter.map(p => decodeParameter(p, context, properties))
    if(parameter.type === 'object') return Object.fromEntries(
      Object.entries(parameter.properties).map(([key, value]) => [key, decodeParameter(value, context, properties)])
    )
    if(parameter.type === 'property') return objectPath(properties, parameter.path)
    if(parameter.type === 'result') return objectPath(context, parameter.path)
    throw new Error(`Invalid parameter type: ${parameter.type}`)
  }

  async function getSource(sourceType, name) {
    switch(sourceType) {
      case 'table':
        return await input.table(name)
      case 'index':
        return await input.index(name)
      case 'log':
        return await input.log(name)
      default:
        throw new Error(`Invalid source type: ${sourceType}`)
    }  
  }

  class DataObservation {

    #planStep = null
    #context = null
    #source = null
    #by = null
    #onChange = null

    #observation = null

    #dependentObservations = new Map()

    #resultsPromise = null
    #results = null

    constructor(planStep, context, source, by, onChange) {
      this.#planStep = planStep
      this.#context = context      
      this.#source = source
      this.#by = by
      this.#onChange = onChange
    }

    async start() {
      const planStep = this.#planStep
      const context = this.#context
      if(!this.#source) this.#source = await getSource(planStep.execution.sourceType, planStep.execution.name)
      if(!this.#by) this.#by = decodeParameter(planStep.execution.by, context, params)
      let results = []      
      const observationPromise = sourceChangeStream(this.#source, this.#by).onChange(async (obj, oldObj) => {   
        const id = obj?.id || oldObj?.id
        if(!id) return

        if(!this.#results) { // still fetching
          results.push(obj)
        } else { // already fetched - maintain memory list of results
          if(oldObj) {
            const index = this.#results.findIndex(result => result.id === oldObj.id)
            if(index !== -1) {
              if(obj) {
                this.#results[index] = obj
              } else {
                this.#results.splice(index, 1)
              }              
            }
          } else if(obj) {
            const index = this.#results.findIndex(result => result.id >= oldObj.id) // idempotency check
            if(index === -1) {
              results.push(obj)
            } else if(this.#results[index].id === oldObj.id) {
              this.#results[index] = obj
            } else {
              this.#results.splice(index, 0, obj)
            }
          }
        }

        const nextContext = { ...context, [planStep.execution.alias]: obj }
        const nextOldContext = { ...context, [planStep.execution.alias]: oldObj }
        
        const objectObservations = []
        
        for(const nextStep of planStep.next) {
          const nextSource = await getSource(nextStep.execution.sourceType, nextStep.execution.name)
          const nextBy = decodeParameter(nextStep.execution.by, nextContext, params)
          const nextOldBy = decodeParameter(nextStep.execution.by, nextOldContext, params)
          const nextByKey = nextBy && serializeKey([nextStep.execution.alias, nextBy])
          const nextOldByKey = nextOldBy && serializeKey([nextStep.execution.alias, nextOldBy])
          if(nextByKey !== nextOldByKey) {
            if(this.#dependentObservations.has(nextOldByKey)) {
              const dependentObservation = this.#dependentObservations.get(nextOldByKey)
              dependentObservation.dispose()
              this.#dependentObservations.delete(nextOldByKey)
            }
            if(!this.#dependentObservations.has(nextByKey)) {
              const dependentObservation = new DataObservation(nextStep, nextContext, nextSource, nextBy, 
                (context, oldContext, observation) => this.handleDependentChange(context, oldContext, observation, id))
              this.#dependentObservations.set(nextByKey, dependentObservation)
              await dependentObservation.start()
            }
          }
          if(nextByKey) objectObservations.push(this.#dependentObservations.get(nextByKey))                    
        }

        /// TODO: do object observations cross product, add self, and push change to parent
      })
      this.#resultsPromise = observationPromise.then(() => {
        this.#results = results
        return results
      })
      this.#observation = await observationPromise      
    }

    async results() {
      if(!this.#results) return this.#results
      return await this.#resultsPromise
    }

    async handleDependentChange(context, oldContext, observation, id) {
      const currentResult = this.#results.find(result => result.id === id)
      if(!currentResult) return /// or delete associated objects      
      const currentContext = { [this.#planStep.execution.alias]: currentResult }
      await this.#onChange({
        ...currentContext,  
        ...context,         
        ...currentContext,       
      }, {
        ...currentContext,  
        ...oldContext,
        ...currentContext,
      }, this)
    }

    dispose() {
      this.#observation.dispose()
      this.#dependentObservations.forEach(dependentObservation => dependentObservation.dispose())
      this.#dependentObservations.clear()
      this.#results = null
      this.#resultsPromise = null
      this.#observation = null
      this.#source = null
      this.#by = null
      this.#planStep = null
      this.#context = null
    }
  }  

  const rootObservations = plan.map(step => new DataObservation(step, {}, null, null, async (newContext, oldContext, observation) => {
    const idParts = idFunction ? idFunction(newContext) : Object.values(newContext).map(v => v?.id)
    const id = serializeKey(idParts)
    await output.change({ ...newContext, id }, { ...oldContext, id })
  }))

  await Promise.all(rootObservations.map(observation => observation.start()))

}
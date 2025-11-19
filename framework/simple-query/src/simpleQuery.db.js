async function simpleQuery(input, output, { _query, ...params }) {

  const plan = _query.plan
  const idFunction = _query.idFunction && eval(`(${_query.idFunction})`)

  function sourceChangeStream(source, by) {
    /// TODO: support arrays that have object - prefixed range queries
    if(typeof by === 'string') return source.object(by)
    if(Array.isArray(by)) {
      if(typeof by.at(-1) === 'string') {
        return source.object(serializeKey(by))
      } else {
        if(by.slice(0, -1).every(item => typeof item === 'string')) {
          const prefix = serializeKeyData(by.slice(0, -1))
          const range = by.at(-1)
          const prefixedRange = {
            gt: range.gt ? prefix + range.gt : undefined,
            gte: range.gte ? prefix + range.gte : undefined,
            lt: range.lt ? prefix + range.lt : undefined,
            lte: range.lte ? prefix + range.lte : undefined,
            reverse: range.reverse,
            limit: range.limit,
          }
          if(!(prefixedRange.gt || prefixedRange.gte)) {
            prefixedRange.gte = prefix
          }
          if(!(prefixedRange.lt || prefixedRange.lte)) {
            prefixedRange.lte = prefix + "\xFF\xFF\xFF\xFF"
          }
          return source.range(prefixedRange)
        } else {
          throw new Error("Impossible to compute range from array: " + JSON.stringify(by))
        }        
      }
    } 
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
    #results = []
    #idFunction = null

    constructor(planStep, context, source, by, onChange, idFunction) {
      this.#planStep = planStep
      this.#context = context      
      this.#source = source
      this.#by = by
      this.#onChange = onChange
      this.#idFunction = idFunction
    }

    async start() {
      const planStep = this.#planStep
      const context = this.#context
      if(!this.#source) this.#source = await getSource(planStep.execution.sourceType, planStep.execution.name)
      if(!this.#by) this.#by = decodeParameter(planStep.execution.by, context, params)
      //output.debug("STARTING OBSERVATION", planStep.execution.sourceType, planStep.execution.name, "BY", this.#by)
      const sourceStream = sourceChangeStream(this.#source, this.#by)
      const observationPromise = sourceStream.onChange(async (obj, oldObj) => {
        /* output.debug(this.#planStep.execution.alias, "!", planStep.execution.sourceType, planStep.execution.name, "BY", this.#by,
          'CHANGE', obj, oldObj) */
        const id = obj?.id || oldObj?.id
        if(!id) return

        const nextContext = { ...context, [planStep.execution.alias]: obj }
        const nextOldContext = { ...context, [planStep.execution.alias]: oldObj }
        
        //const objectObservations = []

        const oldJoinedResults = oldObj ? await this.#joinResults([ oldObj ]) : []
        
        for(const nextStep of planStep.next) {
          const nextSource = await getSource(nextStep.execution.sourceType, nextStep.execution.name)
          const nextBy = decodeParameter(nextStep.execution.by, nextContext, params)
          const nextOldBy = decodeParameter(nextStep.execution.by, nextOldContext, params)
          const nextByKey = nextBy && serializeKeyData([nextStep.execution.alias, nextBy])
          const nextOldByKey = nextOldBy && serializeKeyData([nextStep.execution.alias, nextOldBy])
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
          //if(nextByKey) objectObservations.push(this.#dependentObservations.get(nextByKey))                    
        }        

        const newJoinedResults = obj ? await this.#joinResults([ obj ]) : []

        //output.debug(this.#planStep.execution.alias, "oldJoinedResults", oldJoinedResults, "from", oldObj)
        //output.debug(this.#planStep.execution.alias, "newJoinedResults", newJoinedResults, "from", obj)        

        for(const oldJoinedResult of oldJoinedResults) {
          if(!oldJoinedResult) throw new Error("oldJoinedResult is null")
          if(!newJoinedResults.some(newResult => newResult.id === oldJoinedResult.id)) 
            this.#joinedChange(null, oldJoinedResult)
        }
        for(const newJoinedResult of newJoinedResults) {
          const oldJoinedResult = oldJoinedResults.find(oldResult => oldResult.id === newJoinedResult.id)
          if(oldJoinedResult) {
            if(JSON.stringify(newJoinedResult) !== JSON.stringify(oldJoinedResult)) {
              this.#joinedChange(newJoinedResult, oldJoinedResult)
            }
          } else {
            this.#joinedChange(newJoinedResult, null)
          }
        }

      })
      this.#resultsPromise = observationPromise.then(() => {
        return this.#results
      })
      this.#observation = await observationPromise      
    }

    async #joinedChange(obj, oldObj, observation) {
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
        const index = this.#results.findIndex(result => result.id >= obj.id)
        if(index === -1) {
          this.#results.push(obj)
        } else if(this.#results[index].id === obj.id) {
          this.#results[index] = obj
        } else {
          this.#results.splice(index, 0, obj)
        }
      }
      await this.#onChange(obj, oldObj, this)
    }

    async #joinResults(results) {
      let joinedResults = results.map(result => ({
        __result_id_patrs: [result.id],
        [this.#planStep.execution.alias]: result
      }))
      // output.debug("joined results", joinedResults)
      for(const dependentObservation of this.#dependentObservations.values()) {
        const dependentResults = await dependentObservation.results()
        // output.debug("  dep results", dependentObservation.#planStep.execution.alias, dependentResults)
        joinedResults = joinedResults.flatMap(
          (joinedResult) => {            
            if(dependentResults.length === 0) return [
              { /// TODO: check if optional (not mandatory)
                ...joinedResult,
                [dependentObservation.#planStep.execution.alias]: null
              }
            ]
            return dependentResults.map(dependentJoinedResult => ({            
              ...dependentJoinedResult,
              ...joinedResult,
              __result_id_patrs: joinedResult.__result_id_patrs.concat(dependentJoinedResult.__result_id_patrs)
            }))
          }                     
        )                 
      }      
      //output.debug("joinedResultsAfterDependencies", JSON.stringify(joinedResults, null, 2))
      for(const joinedResult of joinedResults) {
        if(this.#idFunction) {
          output.debug("callIdFunction", _query.idFunction, "on", JSON.stringify(joinedResult, null, 2))
        }
        joinedResult.id = serializeKey(
          this.#idFunction ? this.#idFunction(joinedResult) : joinedResult.__result_id_patrs
        )
      }
      return joinedResults
    }

    async results() {
      if(!this.#results) return this.#results
      return await this.#resultsPromise
    }

    async handleDependentChange(context, oldContext, observation, id) {
      if(!this.#results) return 
      // we need to find thre results affected by the change
      for(const result of this.#results) { // bunary search can be used here for better performance
        if(result.__result_id_patrs[0] === id) {          
          const oldResult = { ...result }
          const alias = observation.#planStep.execution.alias
          result[alias] = context[alias]
          this.#onChange(result, oldResult, observation) /// TODO: handle cases when part is mandatory
        }
      }
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

  const rootObservations = plan.map(step => new DataObservation(step, {}, null, null, 
    (result, oldResult, observation) => {
      if(result) delete result.__result_id_patrs
      if(oldResult) delete oldResult.__result_id_patrs
      output.change(result, oldResult)
    },
    idFunction
    /* async (newContext, oldContext, observation) => {
      const idParts = idFunction ? idFunction(newContext) : Object.values(newContext).map(v => v?.id)
      const id = serializeKey(idParts)
      await output.change({ ...newContext, id }, { ...oldContext, id })
    } */
  ))

  await Promise.all(rootObservations.map(observation => observation.start()))
  await Promise.all(rootObservations.map(observation => observation.results()))

}
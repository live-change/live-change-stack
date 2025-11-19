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

  function applyChange(results, obj, oldObj) {
    if(oldObj) {
      const index = results.findIndex(result => result.id === oldObj.id)
      if(index !== -1) {
        if(obj) {
          results[index] = obj
        } else {
          results.splice(index, 1)
        }              
      }
    } else if(obj) {
      const index = results.findIndex(result => result.id >= obj.id)
      if(index === -1) {
        results.push(obj)
      } else if(results[index].id === obj.id) {
        results[index] = obj
      } else {
        results.splice(index, 0, obj)
      }
    }      
  }

  class DataObservation {

    #planStep = null
    #context = null
    #source = null
    #by = null
    #onChange = null
    #disposed = false
    
    #observation = null

    #dependentObservationsByNext

    #resultsPromise = null
    #results = []
    #rawResults = []

    #idFunction = null

    constructor(planStep, context, source, by, onChange, idFunction) {
      this.#planStep = planStep
      this.#context = context      
      this.#source = source
      this.#by = by
      this.#onChange = onChange
      this.#idFunction = idFunction

      this.#dependentObservationsByNext = new Array(planStep.next.length)
      for(const nextIndex in planStep.next) {
        this.#dependentObservationsByNext[nextIndex] = new Map()
      }
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

        applyChange(this.#rawResults, obj, oldObj)

        const nextContext = { ...context, [planStep.execution.alias]: obj }
        const nextOldContext = { ...context, [planStep.execution.alias]: oldObj }
        
        //const objectObservations = []

        const oldJoinedResults = oldObj ? await this.#joinResults([ oldObj ]) : []
        
        for(const nextStepIndex in planStep.next) {
          const nextStep = planStep.next[nextStepIndex]
          const nextSource = await getSource(nextStep.execution.sourceType, nextStep.execution.name)
          const nextBy = obj && decodeParameter(nextStep.execution.by, nextContext, params)
          const nextOldBy = oldObj && decodeParameter(nextStep.execution.by, nextOldContext, params)
          const nextByKey = nextBy && serializeKeyData(nextBy)
          const nextOldByKey = nextOldBy && serializeKeyData(nextOldBy)
          if(nextByKey !== nextOldByKey) {
            const nextDependentObservations = this.#dependentObservationsByNext[nextStepIndex]
            if(nextOldBy && nextDependentObservations.has(nextOldByKey)) {
              const dependentObservation = nextDependentObservations.get(nextOldByKey)
              dependentObservation.dispose()
              nextDependentObservations.delete(nextOldByKey)
            }
            if(nextBy && !nextDependentObservations.has(nextByKey)) {
              const dependentObservation = new DataObservation(nextStep, nextContext, nextSource, nextBy, 
                (context, oldContext, observation) => this.handleDependentChange(context, oldContext, observation, id))
              nextDependentObservations.set(nextByKey, dependentObservation)
              await dependentObservation.start()
            }
          }
          //if(nextByKey) objectObservations.push(this.#dependentObservations.get(nextByKey))                    
        }        

        const newJoinedResults = obj ? await this.#joinResults([ obj ]) : []

        //output.debug(this.#planStep.execution.alias, "oldJoinedResults", oldJoinedResults, "from", oldObj)
        //output.debug(this.#planStep.execution.alias, "newJoinedResults", newJoinedResults, "from", obj)        

        await this.#joinedChanges(newJoinedResults, oldJoinedResults)

      })
      this.#resultsPromise = observationPromise.then(() => {
        return this.#results
      })
      this.#observation = await observationPromise      
    }

    async #joinedChange(obj, oldObj) {
      applyChange(this.#results, obj, oldObj)
      await this.#onChange(obj, oldObj, this)
    }

    async #joinedChanges(newJoinedResults, oldJoinedResults) {
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
    }

    async #joinResults(results) {
      let joinedResults = results.map(result => ({
        __result_id_patrs: [result.id],
        [this.#planStep.execution.alias]: result
      }))
      //output.debug("joined results", joinedResults)
      for(const nextId in this.#planStep.next) {
        const nextDependentObservations = this.#dependentObservationsByNext[nextId]
        const nextStep = this.#planStep.next[nextId]
        // output.debug("  dep results", dependentObservation.#planStep.execution.alias, dependentResults)
        joinedResults = (await Promise.all(joinedResults.map(
          async (joinedResult) => { 
            const nextBy = decodeParameter(nextStep.execution.by, joinedResult, params)
            const nextByKey = nextBy && serializeKeyData(nextBy)
            const dependentObservation = nextDependentObservations.get(nextByKey)
            let dependentResults = []
            if(dependentObservation) {
              dependentResults = await dependentObservation.results()
            }
            if(dependentResults.length === 0) {
              if(nextStep.mandatory) return []
              return [
                { /// TODO: check if optional (not mandatory)
                  ...joinedResult,
                  [nextStep.execution.alias]: null
                }
              ]
            }
            return dependentResults.map(dependentJoinedResult => ({            
              ...dependentJoinedResult,
              ...joinedResult,
              __result_id_patrs: joinedResult.__result_id_patrs.concat(dependentJoinedResult.__result_id_patrs)
            }))
          }                     
        ))).flat()
      }      
      //output.debug("joinedResultsAfterDependencies", JSON.stringify(joinedResults, null, 2))
      for(const joinedResult of joinedResults) {
        /* if(this.#idFunction) {
          output.debug("callIdFunction", _query.idFunction, "on", JSON.stringify(joinedResult, null, 2))
        } */
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
      if(observation.#disposed) return

      /* console.log("handleDependentChange", context, oldContext, id, 
        "observation", observation.#planStep.execution.alias,
         "to", this.#planStep.execution.alias) */

      const observationByJson = JSON.stringify(observation.#by)

      const affectedRawResults = this.#rawResults.filter(result => 
        JSON.stringify(decodeParameter(observation.#planStep.execution.by, { 
          [this.#planStep.execution.alias]: result 
        }, params)) === observationByJson
      )      

      //console.log("affectedRawResults", affectedRawResults)

      for(const affectedRawResult of affectedRawResults) {
        const id = affectedRawResult.id
        const newJoinedResults = await this.#joinResults([ affectedRawResult ])
        const oldJoinedResults = this.#results.filter(
          joinedResult => joinedResult[this.#planStep.execution.alias].id === id
        )
        //console.log("newJoinedResults", newJoinedResults)
        //console.log("oldJoinedResults", oldJoinedResults)
        await this.#joinedChanges(newJoinedResults, oldJoinedResults)
      }
    }

    dispose() {
      this.#observation.dispose()
      for(const nextIndex in this.#dependentObservationsByNext) {
        const nextDependentObservations = this.#dependentObservationsByNext[nextIndex]
        for(const dependentObservation of nextDependentObservations.values()) {
          dependentObservation.dispose()
        }
        nextDependentObservations.clear()
      }
      this.#results = []
      this.#rawResults = []
      this.#resultsPromise = null
      this.#observation = null
      this.#source = null
      this.#by = null
      this.#planStep = null
      this.#context = null
      this.#disposed = true
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
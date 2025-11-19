async function autoIndex(input, output, { plan, properties }) {

  async function getFromSource(source, by) {
    if(typeof by === 'string') return [await source.object(by).get()]
    return await source.range(by).get()
  }

  async function fetch(planStep, context, oldContext) {
    const { execution, next } = planStep
    const source = await getSource(execution.sourceType, execution.name)
    const by = context && decodeParameter(execution.by, context, properties) 
    const oldBy = oldContext && decodeParameter(execution.by, oldContext, properties)
    const data = await getFromSource(source, by)
    const oldData = await getFromSource(source, oldBy)
    context[execution.alias] = data
    oldContext[execution.alias] = oldData    
  }

  async function gatherOutputData(next, context, oldContext) {
    const outputContext = { ...context }
    const oldOutputContext = { ...oldContext }
    /// first execute next to gather all data
    for(const nextStep of next) {
      await fetch(nextStep, outputContext, oldOutputContext)            
    }
    return [outputContext, oldOutputContext]
  }

/*   function extractMappedDataWithId(mapping, context) {
    const outputData = {}
    const idParts = []
    for(const key in execution.mapping) {
      const outputPath = execution.mapping[key]
      outputData[key] = outputPath.reduce((acc, path) => acc?.[path], outputContext)
      if(!outputData[key]) return null
      idParts.push(outputData[key])
    }
    const id = serializeKey(idParts)
    return { id, outputData }
  } */

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

  function allInPath(path, context) {
    if(!context) return []
    const [ first, ...rest ] = path    
    const values = Array.isArray(context[first]) ? context[first] : [context[first]]
    if(rest.length === 0) return values
    return values.map(value => allInPath(rest, value)).flat()
  }

  function generateOutputData(entries, context) {
    const [ first, ...rest ] = entries
    const values = allInPath(first[1], context)
    //console.log("GENERATE OUTPUT FROM ENGRY", first, "CONTEXT", context, "VALUES", values)
    return values.map(value => {
      if(rest.length === 0) return [{
        [first[0]]: value
      }]
      const generated = generateOutputData(rest, context)
      return generated.map(data => ({
        [first[0]]: value,
        ...data
      }))
    }).flat()
  }

  function keyEntry(entries, entryData) {
    const idParts = new Array(entries.length)
    for(let i = 0; i < entries.length; i++) {      
      idParts[i] = entryData[entries[i][0]]
      if(!idParts[i]) return null
    }
    return { ...entryData, id: serializeKey(idParts) }
  }

  function keyData(entries, data) {
    return data.map(entry => keyEntry(entries, entry)).filter(entry => entry !== null)
  }

  function findChanges(data, oldData) {
    //output.debug("FIND CHANGES", data, "OLD DATA", oldData)
    const byKey = new Map()
    for(const entry of data) {    
      if(byKey.has(entry.id)) {
        throw new Error(`Duplicate id: ${entry.id}`)
      } else {
        byKey.set(entry.id, { id: entry.id, entry, oldEntry: null })
      }      
    }
    for(const entry of oldData) {
      if(byKey.has(entry.id)) {
        byKey.get(entry.id).oldEntry = entry
      } else {
        byKey.set(entry.id, { id: entry.id, entry: null, oldEntry: entry })
      }
    }
    return Array.from(byKey.values())
  }

  const observations = new Map()

  async function execute(planStep, context, oldContext) {
    //output.debug("EXECUTE STEP", planStep, "WITH CONTEXT", context, "AND OLD CONTEXT", oldContext)
    const { execution, next } = planStep    
    if(execution.operation === 'output') {
      const [outputData, oldOutputData] = await gatherOutputData(next, context, oldContext)       

      //output.debug("OUTPUT DATA", outputData, "OLD OUTPUT DATA", oldOutputData)

      const mappingEntries = Object.entries(execution.mapping)
      const mappedData = generateOutputData(mappingEntries, outputData)
      const oldMappedData = generateOutputData(mappingEntries, oldOutputData)

      //output.debug("MAPPED DATA2", mappedData, 'FROM', outputData, "MAP", mappingEntries)
      //output.debug("OLD MAPPED DATA2", oldMappedData, 'FROM', oldOutputData, "MAP", mappingEntries)

      const keyedData = keyData(mappingEntries, mappedData)
      const oldKeyedData = keyData(mappingEntries, oldMappedData)

      //output.debug("KEYED DATA", keyedData, "OLD KEYED DATA", oldKeyedData)

      const changes = findChanges(keyedData, oldKeyedData)
      for(const change of changes) {
        await output.change(change.entry, change.oldEntry)
      }      
      return;
    }
    const source = await getSource(execution.sourceType, execution.name)

    const by = context && decodeParameter(execution.by, context, properties) 
    const oldBy = oldContext && decodeParameter(execution.by, oldContext, properties)
    const byKey = by && serializeKey(by)
    const oldByKey = oldBy && serializeKey(oldBy)
    
    if(byKey !== oldByKey) {
      if(observations.has(oldByKey)) {
        const observation = observations.get(oldByKey)
        observation.dispose()
        observations.delete(oldByKey)
      }
      if(!observations.has(byKey)) {
        const observation = await source.range(by).onChange(async (obj, oldObj) => {
          const nextContext = { ...context, [execution.alias]: obj }
          const nextOldContext = { ...context, [execution.alias]: oldObj } 
          // not ...oldContext, oldContext was used in previous observation
          for(const nextStep of next) {
            await execute(nextStep, nextContext, nextOldContext)
          }
        })
        observations.set(byKey, observation)
      }
    }
  }

  await Promise.all(plan.map(step => execute(step, {}, null)))  
}
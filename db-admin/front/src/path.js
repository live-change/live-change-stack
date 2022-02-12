function extractParams(code) {
  return code.match(/(\$\.[a-z]+)/ig)?.map(p => p.slice(2)) ?? []
}

function sortDependencies(params) {
  const allDependencies = new Set()
  const depsMap = new Map(params.map(param => {
    const extracted = extractParams(param[1])
    allDependencies.add(...extracted)
    return [param[0], new Set(extracted)]
  }))
  let foundNewDeps = true
  while(foundNewDeps) {
    foundNewDeps = false
    for(const [ paramName, paramDependencies ] of depsMap.entries()) {
      for(const dependency of paramDependencies) {
        const deps2 = depsMap.get(dependency) || []
        for(const dep2 of Array.from(deps2)) {
          if(dep2 == paramName) throw new Error("recursive dependency " + dependency)
          if(!paramDependencies.has(dep2)) {
            foundNewDeps = true
            paramDependencies.add(dep2)
            allDependencies.add(dep2)
          }
        }
      }
    }
  }
  const sortedParams = Array.from(depsMap.entries()).sort(
      (a, b) => a[1].size - b[1].size
  )
  return {
    paramsOrder: sortedParams.map(p => p[0]),
    dependencies: depsMap
  }
}

function compilePath(path, params,
                     external = () => { throw new Error("external dependencies not provided") }) {
  const paramsMap = new Map(params)
  const { paramsOrder, dependencies } = sortDependencies([
      ...params,
      [null, path]
  ])

  const pathDependencies = dependencies.get(null)
  const filteredParamsOrder = paramsOrder.filter(p => p && pathDependencies.has(p))

  const externalDependencies = Array.from(pathDependencies).filter(dep => !dependencies.has(dep))
  const externalValues = externalDependencies.map(name => {
    const value = external(name)
    return [name, value]
  })

  const lines = [
      `(() => {`,
      `  const $ = {};`,
      ...externalValues.map(([name, value]) => `  $.${name} = ( ${ value } );`),
      ...filteredParamsOrder.map(paramName => `  $.${paramName} = ( ${ paramsMap.get(paramName) } );`),
      `  return ${path};`,
      `})()`
  ]
  const code = lines.join('\n')
  console.log("CODE", code)
  const value = eval(code)
  return { result: value, external: externalDependencies }
}

export { extractParams, compilePath }

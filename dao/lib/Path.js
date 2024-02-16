function sourceProxy(to, more, target) {
  const proxy = new Proxy({
    $toPath() {
      return to
    },
    $nonEmpty() {
      return sourceProxy({ nonEmpty: to }, more, target)
    },
    $switch(options) {
      return sourceProxy({ value: to, switch: options }, more, target)
    },
    $bind(target) {
      return sourceProxy(to, more, target)
    },
    $target() {
      return target
    },
    $more() {
      return more
    }
  }, {
    get(target, name) {
      if(name[0] == '$') {
        return target[name]
      } else {
        if(to && to.property) return sourceProxy({
          property: [...(Array.isArray(to.property) ? to.property : [to.property]), name]
        })
        return sourceProxy({ property: name })
      }
    }
  })
  return proxy
}

function resolve(schema) {
  if(Array.isArray(schema)) {
    return schema.map(resolve)
  }
  if(typeof schema == 'object') {
    //console.log("RESOLVE", schema)
    if(schema.$toPath) return schema.$toPath()
    const out = {}
    for(const key in schema) out[key] = resolve(schema[key])
    return out
  }
  return schema
}

function processParams(params) {
  let processedParams = {}
  for(const key in params) {
    const param = params[key]
    //console.log("PARAM", key, param)
    const resolvedParam = resolve(param)
    //console.log("RESOLVED PARAM", key, resolvedParam)
    processedParams[key] = resolvedParam
  }
  return processedParams
}

class Path {
  constructor(what, more = undefined, to = undefined, actions = undefined) {
    this.what = what
    this.more = more
    this.to = to
    this.actions = actions
  }
  with(...funcs) {
    let newMore = this.more ? this.more.slice() : []
    for(const func of funcs) {
      const source = sourceProxy()
      const fetchObject = func(source)

      if(fetchObject instanceof Path) {
        const path = fetchObject.what.slice(0, -1)
        const params = fetchObject.what[fetchObject.what.length - 1]
        let processedParams = processParams(params)
        const more = {
          schema: [[...path, { object: processedParams }]],
          more: fetchObject.more,
          to: fetchObject.to
        }
        newMore.push(more)
      } else if(fetchObject.$toPath) { /// sourceProxy returned
        //console.log("FETCH OBJECT PROXY", fetchObject)
        const schema = JSON.parse(JSON.stringify(fetchObject.$toPath(), (key, value) => {
          if(value instanceof Path) {
            const path = value.what.slice(0, -1)
            const params = value.what[value.what.length - 1]
            let processedParams = processParams(params)
            return [...path, { object: processedParams }]
          } else return value
        }))
        const more = {
          schema: [schema],
          more: fetchObject.$more(),
          to: fetchObject.$target()
        }
        newMore.push(more)
      } else {
        console.log("FETCH OBJECT", fetchObject)
        const schema = JSON.parse(JSON.stringify(fetchObject, (key, value) => {
          if(value instanceof Path) {
            const path = value.what.slice(0, -1)
            const params = value.what[value.what.length - 1]
            let processedParams = processParams(params)
            return [...path, { object: processedParams }]
          } else return value
        }))
        const more = {
          schema: [schema],
          more: fetchObject.more,
          to: fetchObject.to
        }
        newMore.push(more)
      }
    }
    return new Path(this.what, newMore, this.to, this.actions)
  }
  action(name, paramsFunc) {
    let newActions = this.actions ? this.actions.slice() : []
    const source = sourceProxy()
    const actionObject = (paramsFunc || to)(source)
    const path = actionObject.slice(0, -1)
    const params = actionObject[actionObject.length - 1]
    let processedParams = processParams(params)
    const action = {
      name: paramsFunc ? name : undefined,
      path,
      params: { object: processedParams },
    }
    newActions.push(action)
    return new Path(this.what, this.more, this.to, newActions)
  }
  get(func) {
    const source = sourceProxy()
    const outputObject = func(source)
    return {
      source: this.what,
      schema: resolve(outputObject)
    }
  }

  bind(to) {
    return new Path(this.what, this.more, to, this.actions)
  }
}

export default Path

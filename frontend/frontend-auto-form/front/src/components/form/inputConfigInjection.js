import { provide, inject, h } from 'vue'

export function provideInputConfig(description, inputConfig) {
  if(!description) throw new Error("provideInputConfig: description is required")
  if(!inputConfig) throw new Error("provideInputConfig: inputConfig is required")
  if(typeof description === 'string') description = { name: description }

  for(let key in description) {
    for(let value of (description[key] instanceof Array ? description[key] : [description[key]])) {
      const provideKey = `input:${key}=${value}`
      //console.log("PROVIDE INPUT CONFIG", provideKey)
      provide(provideKey, {
        inputConfig,
        description
      })
    }
  }
}

export function injectInputConfig(request, defaultInputConfig, factory) {
  if(!request) throw new Error("injectInputConfig: request is required")
  if(typeof request === 'string') request = { name: request }
  //console.log("INJECT INPUT CONFIG", request)
  const filter = request.filter || (() => true)
  delete request.filter

  for(let key in request) {
    const provideKey = `input:${key}=${request[key]}`
    //console.log("INJECT INPUT CONFIG PROVIDE KEY", provideKey)
    const entry = inject(provideKey, null)
    //console.log("RESOLVED INPUT CONFIG", entry)
    if(!entry) continue
    let isValid = true
    for(let key in entry.description) {
      const value = request[key]
      if(Array.isArray(value)) {
        if(!value.includes(entry.description[key])) isValid = false
      } else if(value !== entry.description[key]) isValid = false
    }
    //console.log("RESOLVED COMPONENT VALID", isValid, filter(entry))
    if(isValid && filter(entry)) return entry.inputConfig
  }
  return factory ? defaultInputConfig() : defaultInputConfig
}

import { defineAsyncComponent } from 'vue'
export function inputConfig(src, config) {
  return {
    component: src && defineAsyncComponent(src),
    ...config,
    with(config) {
      return { component: this.component, ...config }
    }
  }
}

import deepmerge from 'deepmerge'
export function injectInputConfigByDefinition(definition) {
  let baseConfig
  if(definition?.input && !baseConfig) baseConfig =
    injectInputConfig({ name: definition.input }, null)
  if(definition?.type && !baseConfig) baseConfig =
    injectInputConfig({ type: definition.type }, null)
  if(!baseConfig) baseConfig = injectInputConfig({ name: 'default' }, null)
  const config = deepmerge(baseConfig, definition?.inputConfig ?? {}) // possible to modify config per input
  if(Object.keys(config).length === 0) return null
  return config
}
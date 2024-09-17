import { provide, inject } from 'vue'

export function provideComponent(description, component) {
  if(!description) throw new Error("provideComponent: description is required")
  if(!component) throw new Error("provideComponent: component is required")
  if(typeof description === 'string') description = { name: description }
  if(!description.name) throw new Error("provideComponent: description.name is required")

  for(let key in description) {
    for(let value of (description[key] instanceof Array ? description[key] : [description[key]])) {
      const provideKey = `component:${description.name}:${key}=${value}`
      provide(provideKey, {
        component,
        description
      })
    }
  }
}


export function injectComponent(request, defaultComponent, factory) {
  if(!request) throw new Error("injectComponent: request is required")
  if(typeof request === 'string') request = { name: request }

  const filter = request.filter || (() => true)
  delete request.filter

  for(let key in request) {
    const provideKey = `component:${request.name}:${key}=${request[key]}`
    const component = inject(provideKey, null)
    if(!component) continue
    let isValid = true
    for(let key in component) {
      const value = request[key]
      if(Array.isArray(value)) {
        if(!value.includes(component[key])) isValid = false
      } else if(value !== component[key]) isValid = false
    }
    if(isValid && filter(component)) return component
  }
  return factory ? defaultComponent() : defaultComponent
}
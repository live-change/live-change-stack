import { provide, inject, h } from 'vue'

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

  console.log("INJECT COMPONENT", request)

  const filter = request.filter || (() => true)
  delete request.filter

  for(let key in request) {
    const provideKey = `component:${request.name}:${key}=${request[key]}`
    console.log("INJECT COMPONENT PROVIDE KEY", provideKey)
    const component = inject(provideKey, null)
    console.log("RESOLVED COMPONENT", component)
    if(!component) continue
    let isValid = true
    for(let key in component.description) {
      const value = request[key]
      if(Array.isArray(value)) {
        if(!value.includes(component.description[key])) isValid = false
      } else if(value !== component.description[key]) isValid = false
    }
    console.log("RESOLVED COMPONENT VALID", isValid)
    if(isValid && filter(component)) return component.component
  }
  return factory ? defaultComponent() : defaultComponent
}

// functional component that injects a component based on the request
export function InjectComponent({ request, defaultComponent, factory, props }, { slots, emit, attrs }) {
  const component = injectComponent(request, defaultComponent, factory)
  const allProps = { ...props }
  if(component?.emits) {
    for(let event of component.emits) {
      allProps['on'+event[0].toUpperCase()+event.slice(1)] = (...args) => emit(event, ...args)
    }
  }
  return component ? h(component, allProps, slots) : slots.fallback()
}
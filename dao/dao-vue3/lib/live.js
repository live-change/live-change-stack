import { ref, onUnmounted, getCurrentInstance, unref, reactive, isRef, shallowRef, watch, computed } from 'vue'
import { collectPointers, ExtendedObservableList, sourceSymbol } from '@live-change/dao'
import nodeDebug from 'debug'
const debug = nodeDebug('dao-vue3')
debug.log = console.log.bind(console)

const liveSymbol = Symbol('live')

function createActionFunction(action, object) {
  function getSource(ptr) {
    throw new Error('not implemented')
    /// TODO: implement
  }
  const objectParams = () => {
    const params = collectPointers(object, [action.params], getSource)[0]
    return params
  }
  const func = async (additionalParams) => {
    const params = { ...additionalParams, ...objectParams() }
    return api.request(action.path, params)
  }
  func.params = objectParams
  func.path = action.path
  return func
}

async function fetch(api, path) {
  if(Array.isArray(path)) path = { what: path }
  const paths = [ path ]
  const preFetchPaths = await api.get({ paths })
  debug("PRE FETCH DATA", preFetchPaths)
  //console.log("PATHS", preFetchPaths)
  //return null
  for(const path of preFetchPaths) {
    if(path.error) {
      throw new Error(''
        + (path.error.stack ?? path.error.message ?? (typeof path.error === 'object' ? JSON.stringify(path.error) : path.error))
        + '\n when fetching '+JSON.stringify(path.what)
      )
    }
  }
  const preFetchMap = new Map(preFetchPaths.map((res) => [JSON.stringify(res.what), res] ))
  function createObject(what, more) {
    const res = preFetchMap.get(JSON.stringify(what))
    debug("PREFETCH", what, "RES", res, "MORE", more, "ERR", res?.error)
    if(res.error) {
      throw new Error(''
        + (res.error.stack ?? res.error.message ?? (typeof res.error === 'object' ? JSON.stringify(res.error) : res.error))
        + '\n when fetching '+JSON.stringify(what) + ' with more=('+JSON.stringify(more)+')'
      )
    }
    const data = JSON.parse(JSON.stringify(res.data))
    if(data) data[sourceSymbol] = what
    if(data && more) {
      if(Array.isArray(data)) {
        for(let i = 0; i < data.length; i ++) {
          for(const moreElement of more) {
            if(moreElement.to) {
              debug("COLLECT POINTERS FROM", data[i], "SC", moreElement.schema)
              const pointers = collectPointers(data[i], moreElement.schema ,
                (what) => preFetchMap.get(JSON.stringify(what)))
              debug("POINTERS COLLECTED", pointers)
              const values = pointers.map(pointer => createObject(pointer, moreElement.more))
              debug("VALUES", values)
              debug("MANY", pointers.many)
              if(pointers.many) {
                data[i][moreElement.to] = values
              } else {
                data[i][moreElement.to] = values[0] || null
              }
            }
          }
        }
      } else {
        for(const moreElement of more) {
          debug("MORE ELEMENT", moreElement)
          if(moreElement.to) {
            const pointers = collectPointers(data, moreElement.schema,
              (what) => preFetchMap.get(JSON.stringify(what)))
            const values = pointers.map(pointer => createObject(pointer, moreElement.more))
            if(pointers.many) {
              data[moreElement.to] = values
            } else {
              data[moreElement.to] = values[0] || null
            }
          }
        }
      }
    }
    return ref(data)
  }
  const object = createObject(path.what, path.more)
  return object
}

async function live(api, path, onUnmountedCb) {
  if(path == null) return ref(null)

  if(!onUnmountedCb && typeof window != 'undefined') {
    if(getCurrentInstance()) {
      onUnmountedCb = onUnmounted
    } else {
      onUnmountedCb = () => {
        console.error("live fetch outside component instance - possible memory leak")
      }
    }
  }

  if(isRef(path)) {
    if(typeof window == 'undefined') {
      debug("FETCH", path.value)
      const data = path.value ? await fetch(api, path.value) : ref(null)
      debug("FETCHED", data)
      await new Promise(resolve => process.nextTick(resolve))
      return data
    }
    let liveRef = shallowRef()
    let onUnmountedCallbacks = []
    let oldPath = null
    let updatePromise = null
    async function update() {
      const newPath = path.value
      if(JSON.stringify(newPath) === oldPath) return
      if(!updatePromise) updatePromise = (async () => {
        const newUnmountedCallbacks = []
        let newLive = null
        if(path.value) {
          newLive = await live(api, newPath, (cb) => newUnmountedCallbacks.push(cb))
        }
        for(const callback of onUnmountedCallbacks) callback()
        liveRef.value = newLive
        onUnmountedCallbacks = newUnmountedCallbacks
        oldPath = JSON.stringify(newPath)
      })().then(() => updatePromise = null)
      if(updatePromise) await updatePromise
      await update()
    }
    await update()
    watch(() => path.value, () => update())
    const result = computed(() => liveRef.value === null ? null : liveRef.value?.value)

    onUnmountedCb(() => {
      console.log("UNMOUNTED COMPUTED PATH", path.value, "ON UNMOUNTED CALLBACKS", onUnmountedCallbacks)
      for(const callback of onUnmountedCallbacks) callback()
    })
    return result
  }

  if(typeof window == 'undefined') {
    const result = await fetch(api, path)
    await new Promise(resolve => process.nextTick(resolve))
    return result
  }
  if(Array.isArray(path)) path = { what: path }
  const paths = [ path ]
  const preFetchPaths = api.observable({ paths })
  const fetchPromises = []
  function bindResult(what, more, actions, object, property, onError) {
    if(!what) throw new Error("what parameter required!")
  //  debugger;
    const observable = api.observable(what)    
/*     console.log("OBSERVABLE", JSON.stringify(observable.getValue()), "K", observable.getValue() && Object.keys(observable.getValue()),
                 "WHAT", what, "SOURCE", observable.getValue()?.[sourceSymbol]) */
    const errorObserver = { error: onError }
    let dispose
    if((more && more.some(m => m.to)) || actions) {
      const extendedObservable = new ExtendedObservableList(observable,
        newElement => {
          if(!newElement) return newElement
          const extendedElement = reactive({ ...newElement })
          const props = {}
          if(more) for(const moreElement of more) {
            if(moreElement.to) {
              const prop = {
                bounds: [],
                sources: []
              }
              props[moreElement.to] = prop
              let requiredSrcs = []
              const srcs = new Map()
              function getSource(ptr) {
                const exists = srcs.get(ptr)
                if(exists !== undefined) return exists.list
                requiredSrcs.push(exists)
                return undefined
              }
              function computePointers() {
                while(true) {
                  const pointers = collectPointers(newElement, moreElement.schema, getSource)
                  if(requiredSrcs.length === 0) return pointers
                  for(const requiredSrc of requiredSrcs) {
                    const observable = api.observable(requiredSrc)
                    const observer = () => {
                      bindPointers(computePointers())
                    }
                    srcs.set(JSON.stringify(requiredSrc), observable)
                    prop.sources.push({ observable, observer })
                    observable.observe(observer)
                  }
                }
              }
              function bindPointers(pointers) {
                if(pointers.many) {
                  const oldBound = prop.bounds.slice()
                  const newArray = new Array(pointers.length)
                  const newBounds = new Array(pointers.length)
                  for(let i = 0; i < pointers.length; i++) {
                    newBounds[i] = bindResult(pointers[i], moreElement.more, moreElement.actions,
                        newArray, i, onError)
                  }
                  prop.bounds = newBounds
                  oldBound.forEach(b => b.dispose())
                  extendedElement[moreElement.to] = newArray
                } else if(pointers.length > 0) {
                  const oldBound = prop.bounds
                  if(!oldBound || oldBound.length === 0 ||
                    JSON.stringify(oldBound[0].what) !== JSON.stringify(pointers[0])) {
                    if(oldBound) {
                      prop.bounds.forEach(b => b.dispose())
                    }
                    if(pointers[0]) {
                      prop.bounds = [
                        bindResult(pointers[0], moreElement.more, moreElement.actions,
                            extendedElement, moreElement.to, onError)
                      ]
                    }
                  }
                }
              }
              bindPointers(computePointers())
            }
          }
          if(actions) for(const action of actions) {
            if(!action.name) continue
            debug("BIND ACTION", action.name, "TO", object)
            extendedElement[action.name] = createActionFunction(action, extendedElement)
          }
          extendedElement[liveSymbol] = props
          return extendedElement
        },
        disposedElement => {
          if(!disposedElement) return
          const boundProps = disposedElement[liveSymbol]
          for(const propName in boundProps) {
            const prop = boundProps[propName]
            const propBounds = prop.bounds
            for(const propBound of propBounds) {
              //console.log("PROP BOUND DISPOSE", propBound)
              propBound.dispose()
            }
            const propSources = prop.sources
            for(const propSource of propSources) {
              debug("PROP SOURCE DISPOSE", propSource)
              debug("UNOBSERVE PROPERTY", what, object, property)
              propSource.observable.unobserve(propSource.observer)
            }
          }
        },
        (data) => {
          if(data && typeof data == 'object') {
            const activated = reactive(data)
            return activated
            data[sourceSymbol] = what
          }
          return data
        }
      )
      const value = extendedObservable.getValue()
      if(value && typeof value == 'object') value[sourceSymbol] = what
      extendedObservable.bindProperty(object, property)
      observable.observe(errorObserver)
      dispose = () => {
        debug("UNBIND PROPERTY", what, object, property)
        extendedObservable.unbindProperty(object, property)
        observable.unobserve(errorObserver)
      }
      fetchPromises.push(extendedObservable.wait())
    } else {
      observable.bindProperty(object, property)
      observable.observe(errorObserver)
      dispose = () => {
        debug("UNBIND PROPERTY", what, object, property)
        observable.unbindProperty(object, property)
        observable.unobserve(errorObserver)
      }
      fetchPromises.push(observable.wait())
    }
    return {
      what, property, dispose
    }
  }
  const resultRef = ref()
  let error = null
  await new Promise((resolve, reject) => {
    const onBindError = (msg) => {
      console.error("LIVE BIND ERROR", msg, 'WHILE FETCHING', path)
      error = msg
      //reject(error)
    }
    const onResolveError = (msg) => {
      console.error("LIVE RESOLVE ERROR", msg, 'WHILE FETCHING', path)
      error = msg
      //reject(error)
    }
    const bound = bindResult(path.what, path.more, path.actions, resultRef, 'value', onBindError)
    const pathsObserver = (signal, value) => {}
    preFetchPaths.observe(pathsObserver)
    onUnmountedCb(() => {
      preFetchPaths.unobserve(pathsObserver)
      bound.dispose()
    })
    preFetchPaths.wait().then((v) => {
      resolve(v)
    }).catch(onResolveError)
  })
  while(fetchPromises.length > 0) { // wait for all fetch promises, including ones added by bindResult
    await fetchPromises.shift()
  }
  while(unref(resultRef) === undefined) { // wait for next tick
    if(error) throw new Error(error)
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
  return resultRef
}

export default live
export { live, fetch }

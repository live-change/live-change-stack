import { ref, onUnmounted, getCurrentInstance, unref, reactive, isRef } from 'vue'
import { collectPointers, ExtendedObservableList } from '@live-change/dao'
import nodeDebug from 'debug'
const debug = nodeDebug('dao-vue3')
debug.log = console.log.bind(console)

const liveSymbol = Symbol('live')

async function live(api, path, onUnmountedCb) {
  if(isRef(path)) {
    /// TODO: support path as ref/computed
    throw new Error('reactive paths not implemented')
  }

  if(!onUnmountedCb && typeof window != 'undefined') {
    if(getCurrentInstance()) {
      onUnmountedCb = onUnmounted
    } else {
      onUnmountedCb = () => {
        console.error("live fetch outside component instance - possible memory leak")
      }
    }
  }

  if(Array.isArray(path)) path = { what: path }
  const paths = [ path ]
  if(typeof window == 'undefined') {
    const preFetchPaths = await api.get({ paths })
    debug("PRE FETCH DATA", preFetchPaths)
    const preFetchMap = new Map(preFetchPaths.map((res) => [JSON.stringify(res.what), res] ))
    function createObject(what, more) {
      const res = preFetchMap.get(JSON.stringify(what))
      if(res.error) throw new Error(res.error)
      const data = res.data
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
    return createObject(path.what, path.more)
  } else {
    const preFetchPaths = api.observable({ paths })
    function bindResult(what, more, object, property, onError) {
      if(!what) throw new Error("what parameter required!")
      const observable = api.observable(what)
      const errorObserver = { error: onError }
      if(more && more.some(m => m.to)) {
        const extendedObservable = new ExtendedObservableList(observable,
          newElement => {
            if(!newElement) return newElement
            const extendedElement = reactive({ ...newElement })
            const props = {}
            for(const moreElement of more) {
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
                    if(requiredSrcs.length == 0) return pointers
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
                      newBounds[i] = bindResult(pointers[i], moreElements.more, newArray, i, onError)
                    }
                    prop.bounds = newBounds
                    oldBound.forEach(b => b.dispose())
                    extendedElement[moreElement.to] = newArray
                  } else if(pointers.length > 0) {
                    const oldBound = prop.bounds
                    if(!oldBound || oldBound.length == 0 ||
                      JSON.stringify(oldBound[0].what) != JSON.stringify(pointers[0])) {
                      if(oldBound) {
                        prop.bounds.forEach(b => b.dispose())
                      }
                      if(pointers[0]) {
                        prop.bounds = [
                          bindResult(pointers[0], moreElement.more, extendedElement, moreElement.to, onError)
                        ]
                      }
                    }
                  }
                }
                bindPointers(computePointers())
              }
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
            }
            return data
          }
        )
        extendedObservable.bindProperty(object, property)
        observable.observe(errorObserver)
        return {
          what,
          property,
          dispose() {
            debug("UNBIND PROPERTY", what, object, property)
            extendedObservable.unbindProperty(object, property)
            observable.unobserve(errorObserver)
          }
        }
      } else {
        observable.bindProperty(object, property)
        observable.observe(errorObserver)
        return {
          what, property,
          dispose() {
            debug("UNBIND PROPERTY", what, object, property)
            observable.unbindProperty(object, property)
            observable.unobserve(errorObserver)
          }
        }
      }
    }
    const resultRef = ref()
    await new Promise((resolve, reject) => {
      let error = null
      const onError = (msg) => {
        console.error("LIVE ERROR", msg)
        if(error) return
        error = msg
        reject(error)
      }
      const bound = bindResult(path.what, path.more, resultRef, 'value', onError)
      const pathsObserver = (signal, value) => {}
      preFetchPaths.observe(pathsObserver)
      onUnmountedCb(() => {
        preFetchPaths.unobserve(pathsObserver)
        bound.dispose()
      })
      preFetchPaths.wait().then(resolve).catch(onError)
    })
    while(unref(resultRef) === undefined) { // wait for next tick
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
    return resultRef
  }
}

export default live
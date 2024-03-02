
let prefix = "$reactiveDaoPath_"

const reactiveMixin = dao => ({
  beforeCreate() {
    if(!this.$options.reactive) return; // Avoid distributed fat

    if (!this.$options.computed) this.$options.computed = {}
    for(let key in this.$options.reactive) {
      let path = this.$options.reactive[key]
      if(typeof path == 'function'){
        this.$options.computed[prefix + key] = path
      } else if(typeof path == 'string') {
      } else if(path.length !== undefined) {
      } else throw new Error("unknown reactive path "+path)
    }
    const optionData = this.$options.data
    this.$options.data = function vueReactiveDaoInjectedDataFn () {
      const data = (
          (typeof optionData === 'function')
              ? optionData.call(this)
              : optionData
      ) || {}
      for (let key in this.$options.reactive) {
        data[key] = undefined
        data[key+"Error"] = undefined
      }
      return data
    }
  },
  created() {
    if(!this.$options.reactive) return; // Avoid distributed fat
    this.reactiveObservables = {}
    let reactiveObservables = this.reactiveObservables
    for(let key in this.$options.reactive) {
      let path = this.$options.reactive[key]
      if(typeof path == 'function'){
        let p = this[prefix + key]
        if(p) {
          reactiveObservables[key] = dao.observable(p)
          reactiveObservables[key].bindProperty(this, key)
          reactiveObservables[key].bindErrorProperty(this, key+"Error")
        }
        let oldPathJson
        this.$watch(prefix + key, newPath => {
          const json = JSON.stringify(newPath)
          const match = JSON.stringify(newPath) == oldPathJson
          oldPathJson = json
          if(match) return
          if(reactiveObservables[key]) {
            this[key] = undefined
            this[key+"Error"] = undefined
            reactiveObservables[key].unbindProperty(this, key)
            reactiveObservables[key].unbindErrorProperty(this, key+"Error")
          }
          delete reactiveObservables[key]
          if(newPath) {
            reactiveObservables[key] = dao.observable(newPath)
            reactiveObservables[key].bindProperty(this, key)
            reactiveObservables[key].bindErrorProperty(this, key+"Error")
          } else {
            this[key] = undefined
          }
        })
      } else if(typeof path == 'string') {
        reactiveObservables[key] = dao.observable(path)
        reactiveObservables[key].bindProperty(this, key)
        reactiveObservables[key].bindErrorProperty(this, key+"Error")
      } else if(path.length !== undefined) {
        reactiveObservables[key] = dao.observable(path)
        reactiveObservables[key].bindProperty(this, key)
        reactiveObservables[key].bindErrorProperty(this, key+"Error")
      } else throw new Error("unknown reactive path "+path)
    }
  },
  beforeDestroy() {
    if(!this.$options.reactive) return; // Avoid distributed fat
    let reactiveObservables = this.reactiveObservables
    for(let key in reactiveObservables) {
      reactiveObservables[key].unbindProperty(this, key)
      reactiveObservables[key].unbindErrorProperty(this, key+"Error")
    }
  }
})

const reactivePrefetchMixin = dao => ({
  beforeCreate() {
    if(typeof window == 'undefined') return; // NO REACTIVE PREFETCH ON SERVER
    if(!this.$options.reactivePreFetch) return;
    if (!this.$options.computed) this.$options.computed = {}
    this.$options.computed[prefix+"_reactivePreFetch"] = function() {
      return this.$options.reactivePreFetch(this.$route, this.$router)
    }
    const optionData = this.$options.data
    this.$options.data = function vueReactiveDaoInjectedDataFn () {
      const data = (
          (typeof optionData === 'function')
              ? optionData.call(this)
              : optionData
      ) || {}
      data.reactivePreFetchedPaths = []
      data.reactivePreFetchError = null
      return data
    }
  },
  created() {
    if(typeof window == 'undefined') return; // NO REACTIVE PREFETCH ON SERVER
    if(!this.$options.reactivePreFetch) return
    let paths = this[prefix+"_reactivePreFetch"]
    if(paths) {
      this.reactivePreFetchObservable = dao.observable({ paths })
      this.reactivePreFetchObservable.bindProperty(this, "reactivePreFetchedPaths")
      this.reactivePreFetchObservable.bindErrorProperty(this, "reactivePreFetchError")
    }
    this.$watch(prefix+"_reactivePreFetch", paths => {
      if(this.reactivePreFetchObservable) {
        this.reactivePreFetchObservable.unbindProperty(this, "reactivePreFetchedPaths")
        this.reactivePreFetchObservable.unbindErrorProperty(this, "reactivePreFetchError")
      }
      delete this.reactivePreFetchObservable
      if(paths) {
        this.reactivePreFetchObservable = dao.observable({ paths })
        this.reactivePreFetchObservable.bindProperty(this, "reactivePreFetchedPaths")
        this.reactivePreFetchObservable.bindErrorProperty(this, "reactivePreFetchError")
      }
    })
  },
  beforeDestroy() {
    if(typeof window == 'undefined') return; // NO REACTIVE PREFETCH ON SERVER
    if(!this.$options.reactivePreFetch) return; // Avoid distributed fat
    if(this.reactivePreFetchObservable) {
      this.reactivePreFetchObservable.unbindProperty(this, "reactivePreFetchedPaths")
      this.reactivePreFetchObservable.unbindErrorProperty(this, "reactivePreFetchError")
    }
  }
})

const reactiveComponent = dao => ({
  name: "Reactive",
  props: {
    what: {
      type: Object
    }
  },
  data() {
    let values = {}, errors = {}
    for(const key in this.what) {
      values[key] = undefined
      values[key + 'Error'] = undefined
    }
    return {
      values
    }
  },
  created() {
    this.observables = {}
    for(const name in this.what) {
      const what = this.what[key]
      const observable = dao.observable(what)
      this.observables[name] = observable
      observable.bindProperty(this.values[name])
      observable.bindErrorProperty(this.values[name+'Error'])
    }
  },
  beforeDestroy() {
    for(const name in this.observables) {
      const observable = this.observables[name]
      observable.unbindProperty(this, "reactivePreFetchedPaths")
      observable.unbindErrorProperty(this, "reactivePreFetchError")
    }
  },
  render(createElement) {
    return this.$scopedSlots.default(this.values)[0]
  }
})

const ReactiveDaoVue = {
  install(Vue, options) {
    if(!options || !options.dao) throw new Error("dao option required")
    const dao = options.dao

    Vue.mixin(reactiveMixin(dao))

    Vue.mixin(reactivePrefetchMixin(dao))

    Vue.component('reactive', reactiveComponent(dao))
  }
}

export { ReactiveDaoVue, reactiveMixin, reactivePrefetchMixin, reactiveComponent }

export default ReactiveDaoVue

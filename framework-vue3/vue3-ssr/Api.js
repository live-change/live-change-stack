import * as LcDao from '@live-change/dao'
const { DaoProxy, DaoPrerenderCache, DaoCache, Path } = LcDao // hack for vite
import validators from '@live-change/framework/lib/utils/validators.js'
import { hashCode, encodeNumber, uidGenerator, randomString } from '@live-change/uid'
import { ref, computed, watch, reactive } from "vue"

class Api extends DaoProxy {
  constructor(source, settings = {}) {
    super()
    this.source = source
    this.settings = settings

    this.uidGenerator = () => { throw new Error("uid generator not initialized yet") }

    this.createReactiveObject = this.settings.createReactiveObject

    this.preFetchComponents = []
    this.afterPreFetch = []

    this.validators = { ...validators }

    this.globals = {
      $validators: this.validators
    }
    this.globalInstances = []
    this.readyPromise = new Promise(resolve => {
      this.resolveReadyPromise = resolve
    })

    this.servicesDefinitions = ref()
  }

  setup(settings = this.settings) {
    this.settings = settings
    this.createReactiveObject = this.settings.createReactiveObject
    this.setupCaches()
    this.setupMetadata()
  }

  setupCaches() {
    let dao = this.source
    if(this.settings.cache) {
      const cacheSettings = (typeof this.settings.cache) == 'object' ? this.settings.cache : {}
      this.dataCache = new DaoCache(dao, cacheSettings)
      dao = this.dataCache
    }
    if(this.settings.ssr) {
      this.prerenderCache = new DaoPrerenderCache(dao)
      dao = this.prerenderCache
      if(typeof window == 'undefined') {
        this.prerenderCache.mode = 'save'
      } else {
        this.prerenderCache.mode = 'load'
        this.prerenderCache.setCache(window[this.settings.ssrCacheGlobal || '__DAO_CACHE__'])
      }
    }
    this.setDao(dao)
  }

  setupMetadata() {
    const api = ref()
    this.apiObservable = this.observable(['metadata', 'api'])
    //console.log("API OBSERVABLE", this.apiObservable)
    //this.apiObservable.bindProperty(api, 'value')
    const version = ref()
    this.versionObservable = this.observable(['version', 'version'])
    this.versionObservable.bindProperty(version, 'value')
    const softwareVersion = computed(() => {
      if(typeof window == 'undefined') return
      return window[this.settings.ssrVersionGlobal || '__VERSION__']
    })
    const versionMismatch = computed(() => {
      if(!version) return
      if(!softwareVersion) return
      if(softwareVersion.value === 'unknown') return false
      return version.value !== softwareVersion.value
    })
    const client = computed(() => api?.value?.client)
    const config = computed(() => api?.value?.config)
    this.metadata = {
      api, version,
      softwareVersion,
      versionMismatch,
      client, config
    }
    let lastApiJson = ''
    this.apiObservable.observe((signal, ...args) => {
      if(signal !== 'set') return
      //console.log("API OBSERVE SIGNAL", signal, ...args)
      const newApi = args[0]
      //console.log("NEW API", newApi)
      if(JSON.stringify(newApi) === lastApiJson) {
        console.log("API NOT CHANGED")
        return
      }
      if(lastApiJson) console.log("API CHANGED", lastApiJson, JSON.stringify(newApi))
      lastApiJson = JSON.stringify(newApi)
      /// First, generate the API for microservices, then set api.value – otherwise, a race condition is possible
      /// if something reacts to the api value, either the client or the config, and uses the microservices API.
      this.generateServicesApi()
    })
    //console.log("SETUP API", api.value)
    // this.afterPreFetch.push(() => this.generateServicesApi()) - i think it's not needed
  }

  generateServicesApi() {
    let apiInfo = this.apiObservable.getValue()
    const api = this
    if(!apiInfo) {
      const cachePath = '["metadata","api"]'
      if(typeof window != 'undefined') {
        const ssrCache = window[this.settings.ssrCacheGlobal || '__DAO_CACHE__']
        if(ssrCache) {
          for(const [daoPath, value] of ssrCache) {
            if(daoPath === cachePath) apiInfo = value
          }
        }
      } else {
        apiInfo = this.prerenderCache.cache.get(cachePath)
      }
    }
    if(!apiInfo) throw new Error("API INFO NOT FOUND! UNABLE TO GENERATE SERVICES API!")

    api.windowId = this.settings.windowId || randomString(10)
    api.shortWindowId = api.windowId.split('@')[0].slice(-5).replace('.', '')

    //console.trace("GENERATE API SERVICES!")
    //console.log("GENERATE SERVICES API", apiInfo)
    const definitions = [...(apiInfo?.services ?? []), ...(this.settings.localDefinitions ?? [])]
    if(JSON.stringify(definitions) === JSON.stringify(api.servicesApiDefinitions)) return
    if(!definitions) throw new Error("API DEFINITIONS NOT FOUND! UNABLE TO GENERATE API!")
    api.uidGenerator = uidGenerator(
      apiInfo.client.user || (apiInfo.client.session ? apiInfo.client.session.slice(0, 16) : randomString(10) )
      , 1, '[]', api.shortWindowId)
    //console.log("GENERATE API DEFINITIONS", definitions)
    api.servicesApiDefinitions = definitions
    api.servicesDefinitions.value = definitions
    let globalViews = api.views || {}
    let globalFetch = api.fetch || ((...args) => new Path(...args))
    let globalActions = api.actions || {}
    let globalModels = api.models || {}
    let globalServices = api.services || {}
    for(const serviceDefinition of definitions) {
      let fetch = { }
      globalFetch[serviceDefinition.name] = fetch
      /// generate new fetch
      for(const actionName in serviceDefinition.actions) {
        fetch[actionName] = (params) => [serviceDefinition.name, actionName, params]
        fetch[actionName].definition = serviceDefinition.actions[actionName]
      }
      for(const viewName in serviceDefinition.views) {
        fetch[viewName] = (params) => new Path([serviceDefinition.name, viewName, params])
        fetch[viewName].definition = serviceDefinition.views[viewName]
      }
      /// delete old fetch entries
      for(const name in fetch) {
        if(!serviceDefinition.actions[name] && !serviceDefinition.views[name]) delete fetch[name]
      }
      /// generate new actions
      let actions = { }
      globalActions[serviceDefinition.name] = actions
      for(const actionName in serviceDefinition.actions) {
        actions[actionName] = (params) => api.command([serviceDefinition.name, actionName], params)
        actions[actionName].definition = serviceDefinition.actions[actionName]
      }
      /// delete old actions
      for(const actionName in actions) {
        if(!serviceDefinition.actions[actionName]) delete actions[actionName]
      }
      /// generate new views
      let views = { }
      globalViews[serviceDefinition.name] = views
      for(const viewName in serviceDefinition.views) {
        //console.log("GENERATE VIEW", serviceDefinition.name, viewName)
        views[viewName] = (params) => [serviceDefinition.name, viewName, params]
        views[viewName].definition = serviceDefinition.views[viewName]
      }
      /// delete old views
      for(const viewName in views) {
        if(!serviceDefinition.views[viewName]) delete views[viewName]
      }
      /// generate new models
      let models = { }
      globalModels[serviceDefinition.name] = models
      for(const modelName in serviceDefinition.models) {
        models[modelName] = serviceDefinition.models[modelName]
      }
      /// delete old models
      for(const modelName in models) {
        if(!serviceDefinition.models[modelName]) delete models[modelName]
      }
      /// generate new services
      globalServices[serviceDefinition.name] = {
        actions, views, models, definitions, config: serviceDefinition.clientConfig
      }
    }

    api.views = globalViews
    api.fetch = globalFetch
    api.actions = globalActions
    api.client = this.metadata.client
    api.uid = api.uidGenerator
    api.services = globalServices
    api.models = globalModels

    api.globals.$lc = api

    api.globals.$allLoadingTasks = reactive([])
    api.globals.$allLoadingErrors = reactive([])
    api.globals.$allWorkingTasks = reactive([])
    api.globals.$allWorkingErrors = reactive([])

    /// Deprecated:
    api.globals.$api = this
    api.globals.$views = this.views
    api.globals.$actions = this.actions
    api.globals.$fetch = this.fetch
    api.globals.$services = this.services

    for(const glob of this.globalInstances) {
      this.installInstanceProperties(glob)
    }

    api.metadata.api.value = apiInfo

    if(api.resolveReadyPromise) {
      api.resolveReadyPromise()
      api.resolveReadyPromise = null
    }
  }

  addGlobalInstance(globalProperties) {
    this.globalInstances.push(globalProperties)
    this.installInstanceProperties(globalProperties)
  }

  installInstanceProperties(globalProperties) {
    for(const key in this.globals) {
      globalProperties[key] = this.globals[key]
    }
  }

  async preFetch() {
    let preFetchPromises = []
    for(const component of this.preFetchComponents) {
      if(component.$options.reactivePreFetch) {
        const paths = component.$options.reactivePreFetch.apply(this.globals)
        console.log("PREFETCH PATHS", JSON.stringify(paths))
        const promise = this.get({ paths })/*.then(results => {
          for(let { what, data } of results) {
            this.prerenderCache.set(what, data)
          }
        })*/// It's useless because DaoPrerenderCache support paths
        preFetchPromises.push(promise)
      }
    }
    preFetchPromises.push(this.get({ paths: [
      { what: ['metadata', 'api'] },
      { what: ['version', 'version'] }
    ]}))
    //console.log("PREFETCH WAIT!")
    // const apiPromise = this.apiObservable.wait()
    // apiPromise.then(res => console.log("API RES", res))
    // const versionPromise = this.versionObservable.wait()
    // versionPromise.then(res => console.log("VERSION RES", res))
    // if(this.apiObservable.getValue() === undefined) preFetchPromises.push(apiPromise)
    // if(this.versionObservable.getValue() === undefined) preFetchPromises.push(versionPromise)
    await Promise.all(preFetchPromises)
    //console.log("PREFETCHED", this.metadata.api, this.metadata.version)
    for(const afterPreFetch of this.afterPreFetch) {
      afterPreFetch()
    }
  }

  async preFetchRoute(route, router) {
    let preFetchPromises = []
    for(const matched of route.value.matched) {
      for(const name in matched.components) {
        const component = matched.components[name]
        if(component.reactivePreFetch) {
          let paths = component.reactivePreFetch.call(this.globals, route.value, router)
          //console.log("ROUTE", route, "PREFETCH PATHS", JSON.stringify(paths))
          const promise = this.get({ paths }).then(results => {
            for(let { what, data } of results) {
              this.prerenderCache.set(what, data)
            }
          })
          preFetchPromises.push(promise)
        }
      }
    }
    return Promise.all(preFetchPromises)
  }

  command(method, args = {}) {
    const _commandId = args._commandId || this.uidGenerator()
    //console.trace("COMMAND "+_commandId+":"+JSON.stringify(method))
    console.log("COMMAND "+_commandId+":"+JSON.stringify(method)+"("+JSON.stringify(args)+")")
    return this.request(method, { ...args, _commandId })
  }

  reverseRange(range) {
    return {
      gt: range.lt,
      gte: range.lte,
      lt: range.gt === '' ? '\xFF\xFF\xFF\xFF' : range.gt,
      lte: range.gte,
      limit: range.limit,
      reverse: !range.reverse
    }
  }

  getServiceDefinition(serviceName) {
    return this.metadata.api.value.services.find(s => s.name === serviceName)
  }
  getViewDefinition(serviceName, viewName) {
    return this.metadata.api.value.services.find(s => s.name === serviceName)?.views[viewName]
  }
  getModelDefinition(serviceName, modelName) {
    return this.metadata.api.value.services.find(s => s.name === serviceName)?.models[modelName]
  }
  getActionDefinition(serviceName, actionName) {
    return this.metadata.api.value.services.find(s => s.name === serviceName)?.actions[actionName]
  }
  getServiceClient(serviceName) {
    return this.metadata.api.value.services.find(s => s.name === serviceName)?.clientConfig
  }
  getActionMethod(serviceName, actionName) {
    const serviceDefinition = this.getServiceDefinition(serviceName)
    if(!serviceDefinition) return () => { throw new Error("Service not accessible: "+serviceName) }
    const actionDefinition = serviceDefinition?.actions?.[actionName]
    //console.log("ACTION DEFINITION", serviceName, actionName, actionDefinition, 'IN', serviceDefinition?.actions)
    if(!actionDefinition) return () => { throw new Error("Action not accessible: "+serviceName+"."+actionName) }
    return (params) => this.command([serviceDefinition.name, actionName], params)
  }


  uploadFile(purpose, fileName, blob, id) {
    if (!id) id = this.uidGenerator()
    const xhr = new XMLHttpRequest()
    const state = ref({ id, state: 'starting', transferred: 0, percent: 0, size: blob.size, xhr })
    xhr.upload.addEventListener("progress", (evt) => {
      const percent = evt.loaded / evt.total * 100;
      state.value = { ...state.value, percent, transferred: evt.loaded }
    }, false)
    xhr.addEventListener("readystatechange", (evt) => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          state.value = { ...state.value, state: "done" }
        } else {
          state.value = { ...state.value, state: "failed", error: xhr.status + " " + xhr.responseText }
        }
      }
    })
    xhr.addEventListener("error", (evt) => {
      state.value = { ...state.value, state: "failed", error: 'XHR error' }
    })
    xhr.addEventListener("abort", (evt) => {
      state.value = { ...state.value, state: "failed", error: 'XHR aborted' }
    })
    const url = `${document.location.protocol}//${document.location.host}/upload/${purpose}/${fileName}/${id}`
    xhr.open("POST", url, true)
    xhr.send(blob)
    return state
  }

}

export default Api

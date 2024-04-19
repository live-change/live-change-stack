import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import resolveCb from 'resolve'
const resolve = promisify(resolveCb)
import App from "@live-change/framework"
const app = App.app()

import Debug from 'debug'
const debug = Debug('framework')

class Services {
  constructor(config) {
    if(!config) throw new Error("services config parameter is required")
    if(typeof config == 'string') {
      this.configPath = path.resolve(config)
      this.servicesDir = path.dirname(this.configPath)
      this.configPromise = import(path.resolve(this.configPath)).then(x => x.default)
      this.config = null
    } else {
      this.config = config
      this.configPromise = Promise.resolve(config)
    }

    this.plugins = []
    this.serviceDefinitions = []
    this.services = []
  }

  async resolve(file) {
    const path = await resolve(file, { basedir: this.servicesDir })
    debug("PATH RESOLVE", file, "IN", this.servicesDir, "=>", path)
    return path
  }
  async getServiceEntryFile(config) {
    const path = await resolve(config.path, { basedir: this.servicesDir })
    debug("PATH RESOLVE", config.path, "IN", this.servicesDir, "=>", path)
    return path
  }

  async servicesList() {
    this.config = await this.configPromise
    return this.config.services.map(s => s.name)
  }
  async serviceConfig(serviceName) {
    this.config = await this.configPromise
    return this.config.services.find(s => s.name = serviceName)
  }
  async loadServices() {

    this.config = await this.configPromise
    app.config.services = this.config.services
    app.config.plugins = this.config.plugins

    if(this.config.plugins) {
      for(const plugin of this.config.plugins) {
        if(plugin.module) {
          const module = plugin.module
          const definition = module
          this.plugins.push(definition)
        } else {
          const entryFile = await this.getServiceEntryFile(plugin)
          debug("PLUGIN", plugin, 'ENTRY FILE', entryFile)
          const module = await import(entryFile)
          this.plugins.push(module.default)
        }
      }
    }
    if(this.config.services) {
      for(const service of this.config.services) {
        if(service.module) {
          const module = service.module
          const definition = module
          this.serviceDefinitions.push(definition)
          //console.log("SERVICE DEFINITION", definition, "OF", service)
        } else {
          const entryFile = await this.getServiceEntryFile(service)
          debug("SERVICE", service, 'ENTRY FILE', entryFile)
          const module = await import(entryFile)
          const definition = module.default
          if (definition.name != service.name) {
            console.error("SERVICE", service, "NAME", service.name, "MISMATCH", definition.name)
            process.exit(1)
          }
          this.serviceDefinitions.push(definition)
        }
      }
    }
    // push validators from services to other services
    for(const sourceServiceDefinition of this.serviceDefinitions) {
      for(const validatorName in sourceServiceDefinition.validators) {
        for(const destinationServiceDefinition of this.serviceDefinitions) {
          if(!destinationServiceDefinition.validators[validatorName]) {
            destinationServiceDefinition.validators[validatorName] = sourceServiceDefinition.validators[validatorName]
          }
        }
      }
    }

    /// TODO: load dependent services!!!
  }

  generateApiFile(path) {
    const out = fs.createWriteStream(path)
    out.write("import api from 'api'\n")
    out.write("import Vue from 'vue'\n\n")
    out.write("const views = {\n")
    for(const serviceDefinition of this.serviceDefinitions) {
      out.write(`  ${serviceDefinition.name}: {\n`)
      for(const viewName in serviceDefinition.views) {
        const viewDefinition = serviceDefinition.views[viewName]
        out.write(`    ${viewName}({ ${Object.keys(viewDefinition.properties).join(', ')} }) {\n`)
        out.write(`      return ['${serviceDefinition.name}', '${viewName}', `+
            `{ ${Object.keys(viewDefinition.properties).join(', ')} }]\n`)
        out.write(`    },\n`)
      }
      out.write(`  },\n`)
    }
    out.write("}\n\n")
    out.write("const fetch = {\n")
    for(const serviceDefinition of this.serviceDefinitions) {
      out.write(`  ${serviceDefinition.name}: {\n`)
      for(const viewName in serviceDefinition.views) {
        const viewDefinition = serviceDefinition.views[viewName]
        out.write(`    ${viewName}({ ${Object.keys(viewDefinition.properties).join(', ')} }) {\n`)
        out.write(`      return api.fetch(['${serviceDefinition.name}', '${viewName}', `+
            `{ ${Object.keys(viewDefinition.properties).join(', ')} }])\n`)
        out.write(`    },\n`)
      }
      out.write(`  },\n`)
    }
    out.write("}\n\n")
    out.write("const actions = {\n")
    for(const serviceDefinition of this.serviceDefinitions) {
      out.write(`  ${serviceDefinition.name}: {\n`)
      for(const actionName in serviceDefinition.actions) {
        const actionDefinition = serviceDefinition.actions[actionName]
        out.write(`    async ${actionName}({ ${Object.keys(actionDefinition.properties).join(', ')} }) {\n`)
        out.write(`      return await api.command(['${serviceDefinition.name}', '${actionName}'], `+
            `{ ${Object.keys(actionDefinition.properties).join(', ')} })\n`)
        out.write(`    },\n`)
      }
      out.write(`  },\n`)
    }
    out.write("}\n\n")
    out.write("api.views = views\n")
    out.write("api.actions = actions\n")
    out.write("api.fetch = fetch\n")
    out.write("Vue.prototype.$views = views\n")
    out.write("Vue.prototype.$actions = actions\n")
    out.write("Vue.prototype.$session = api.session\n")
    out.write("export default { views, actions }\n")
    out.end()
  }

  async processDefinitions() {
    for(const defn of this.serviceDefinitions) {
      if(!defn.processed) {
        app.processServiceDefinition(defn)
        defn.processed = true
      }
    }
  }


  async update() {
    for(const defn of this.serviceDefinitions) {
      console.group()
      console.log("#### UPDATE SERVICE", defn.name)
      if(!defn.processed) {
        app.processServiceDefinition(defn)
        defn.processed = true
      }
      await app.updateService(defn)
      console.log("#### UPDATED SERVICE", defn.name)
      console.groupEnd()
    }
  }

  async start(startOptions) {
    // when starting all services at once remove triggerRoutes for cleanup
    await app.dao.request(['database', 'deleteTable'], app.databaseName, 'triggerRoutes').catch(e => 'ok')
    await Promise.all(this.plugins.map(plugin => plugin(app, this)))
    this.servicesPromise = Promise.all(this.serviceDefinitions.map(defn => {
      if(!defn.processed) {
        app.processServiceDefinition(defn)
        defn.processed = true
      }
      return app.startService(defn, startOptions)
    }))
    this.services = await this.servicesPromise
  }

  async getServicesObject() {
    await this.servicesPromise
    let object = {}
    for(const service of this.services) object[service.name] = service
    return object
  }

}

export default Services

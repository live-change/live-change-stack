const { app } = require("@live-change/framework")

async function setupApiEndpoints(expressApp, apiServer) {
  for(const serviceDefinition of apiServer.services.serviceDefinitions) {
    const { name, endpoints } = serviceDefinition
    for(const endpoint of endpoints) {
      const path = endpoint.name ? `/api/${name}/${endpoint.name}` : `/${name}`
      const express = await endpoint.create()
      expressApp.use(path, express)
    }
  }
}

module.exports = setupApiEndpoints
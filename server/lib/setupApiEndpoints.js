const { app } = require("@live-change/framework")

function setupApiEndpoints(expressApp, apiServer) {
  for(const serviceDefinition of apiServer.services.serviceDefinitions) {
    const { name, endpoints } = serviceDefinition
    for(const endpoint of endpoints) {
      const path = endpoint.name ? `/api/${name}/${endpoint.name}` : `/${name}`
      const express = endpoint.create()
      console.log("INSTALL ENDPOINT", path)
      expressApp.use(path, express)
    }
  }
}

module.exports = setupApiEndpoints
async function setupApiEndpoints(expressApp, apiServer) {
  for(const serviceDefinition of apiServer.services.serviceDefinitions) {
    const { name, endpoints } = serviceDefinition
    for(const endpoint of endpoints) {
      let paths = endpoint.path ?? (endpoint.name ? `/api/${name}/${endpoint.name}` : `/${name}`)
      if(!Array.isArray(paths)) paths = [paths]
      const handler = await endpoint.create()
      for(const path of paths) {
        expressApp.use(path, handler)
      }
    }
  }
}

export default setupApiEndpoints
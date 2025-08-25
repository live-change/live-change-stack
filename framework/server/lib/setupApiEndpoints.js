export async function setupApiEndpoints(expressApp, apiServer) {
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

export async function setupEndpointsProxyPaths(expressApp, proxy, services) {
  for(const service of services.services) {
    const { module } = service
    const { name, endpoints } = module
    //console.log("SERVICE", name, "HAS ENDPOINTS", endpoints)
    if(!endpoints) continue
    for(const endpoint of endpoints) {
      let paths = endpoint.path ?? (endpoint.name ? `/api/${name}/${endpoint.name}` : `/${name}`)
      if(!Array.isArray(paths)) paths = [paths]
      paths = paths.filter(path => !path.startsWith('/api/')) // api will be proxied anyway
      for(const path of paths) {
        console.log("PROXY", path)
        expressApp.use(path, proxy)
      }
    }
  }
}

export default setupApiEndpoints
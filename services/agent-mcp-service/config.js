import definition from './definition.js'

const raw = definition.config || {}
const endpoints = Array.isArray(raw.endpoints) ? raw.endpoints : []

function publicEndpoint(endpoint) {
  return {
    name: endpoint.name,
    path: endpoint.path,
    ssePath: endpoint.ssePath || null,
    requireToken: !!endpoint.requireToken,
    serverName: endpoint.serverName || endpoint.snippetName || 'agent-mcp',
    snippetName: endpoint.snippetName || endpoint.serverName || endpoint.name || 'agent-mcp'
  }
}

definition.clientConfig = {
  endpoints: endpoints.map(publicEndpoint)
}

export default {
  endpoints,
  customTools: raw.customTools || null
}

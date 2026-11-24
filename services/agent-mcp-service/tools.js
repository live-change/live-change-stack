import App from '@live-change/framework'
const app = App.app()

import config from './config.js'
import { buildToolMap } from './generator.js'

const toolCaches = new Map()
let customToolsPromise = null

function servicesReady() {
  return Object.keys(app.startedServices || {}).length > 0
}

function loadCustomTools() {
  if (!config.customTools) return Promise.resolve({})
  if (!customToolsPromise) {
    customToolsPromise = Promise.resolve()
      .then(() => config.customTools())
      .then(loaded => loaded?.default || loaded || {})
  }
  return customToolsPromise
}

export function resetToolsCache() {
  toolCaches.clear()
  customToolsPromise = null
}

export function resolveEndpoint(context = {}) {
  const endpoints = config.endpoints || []
  if (context.endpoint) return context.endpoint
  if (context.endpointName) {
    const named = endpoints.find(endpoint => endpoint.name === context.endpointName)
    if (!named) throw new Error('MCP endpoint not found: ' + context.endpointName)
    return named
  }
  return endpoints.find(endpoint => endpoint.name === 'open') || endpoints[0] || null
}

async function toolsFor(endpoint) {
  if (!endpoint) return {}
  if (!servicesReady()) {
    toolCaches.clear()
    return {}
  }
  if (!toolCaches.has(endpoint.name)) {
    const customTools = await loadCustomTools()
    toolCaches.set(endpoint.name, buildToolMap(app, endpoint, customTools))
  }
  return toolCaches.get(endpoint.name)
}

function serialize(endpoint, name, result) {
  if (endpoint?.serializeResult) return endpoint.serializeResult(name, result)
  return JSON.stringify(result)
}

function mcpErrorMessage(error) {
  if (typeof error === 'string') return error
  if (typeof error?.message === 'string' && error.message) return error.message
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

export async function handleMcpRequest(req, context = {}) {
  const { method, params, id } = req || {}
  let endpoint
  try {
    endpoint = resolveEndpoint(context)
  } catch (error) {
    return { jsonrpc: '2.0', id, error: { code: -32603, message: error.message || String(error) } }
  }
  const serverName = endpoint?.serverName || 'agent-mcp-server'
  try {
    if (method === 'initialize') {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: serverName, version: '1.0.0' }
        }
      }
    }
    if (method === 'tools/list') {
      const tools = await toolsFor(endpoint)
      return {
        jsonrpc: '2.0',
        id,
        result: {
          tools: Object.entries(tools).map(([name, def]) => ({
            name,
            description: def.description,
            inputSchema: def.inputSchema
          }))
        }
      }
    }
    if (method === 'tools/call') {
      const name = params?.name
      const tools = await toolsFor(endpoint)
      const tool = tools[name]
      if (!tool) {
        return { jsonrpc: '2.0', id, error: { code: -32601, message: 'Tool not found: ' + name } }
      }
      const result = await tool.handler(params?.arguments || {}, {
        ...context,
        endpoint,
        auth: context.auth || null
      })
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: serialize(endpoint, name, result) }],
          isError: false
        }
      }
    }
    return { jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found: ' + method } }
  } catch (error) {
    return { jsonrpc: '2.0', id, error: { code: -32603, message: mcpErrorMessage(error) } }
  }
}

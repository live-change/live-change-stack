import { shouldExposeTool } from './exposeConfig.js'
import { inputSchemaFromProperties } from './schemaFromDefinition.js'
import { prepareOpenCall, prepareTokenCall, withMcpUserParam } from './clientFactory.js'

function defaultToolName(serviceName, definitionName) {
  return serviceName + '_' + definitionName
}

function defaultDescription(serviceName, definitionName, kind) {
  const label = kind === 'action' ? 'Action' : 'View'
  return label + ' ' + definitionName + ' from ' + serviceName
}

function getStartedService(app, serviceName) {
  const service = app.startedServices?.[serviceName]
  if (!service) throw new Error('Service ' + serviceName + ' is not started')
  return service
}

function manifestOf(endpoint) {
  return endpoint.expose || {
    includeServices: [],
    includeTools: [],
    excludeTools: []
  }
}

function createActionTool(app, endpoint, serviceName, actionName, actionDef, mcp) {
  return {
    description: mcp.description || defaultDescription(serviceName, actionName, 'action'),
    inputSchema: withMcpUserParam(
      inputSchemaFromProperties(actionDef.properties, app),
      serviceName,
      endpoint
    ),
    async handler(args, callContext = {}) {
      const service = getStartedService(app, serviceName)
      const prepared = endpoint.requireToken
        ? prepareTokenCall(args, callContext.auth)
        : prepareOpenCall(endpoint, serviceName, args)
      const result = await service.actions[actionName].callCommand(prepared.payload, prepared.client)
      if (endpoint.afterAction) {
        await endpoint.afterAction({
          app,
          serviceName,
          actionName,
          user: prepared.user,
          result,
          client: prepared.client
        })
      }
      return result
    }
  }
}

function createViewTool(app, endpoint, serviceName, viewName, viewDef, mcp) {
  return {
    description: mcp.description || defaultDescription(serviceName, viewName, 'view'),
    inputSchema: withMcpUserParam(
      inputSchemaFromProperties(viewDef.properties, app),
      serviceName,
      endpoint
    ),
    async handler(args, callContext = {}) {
      const prepared = endpoint.requireToken
        ? prepareTokenCall(args, callContext.auth)
        : prepareOpenCall(endpoint, serviceName, args)
      if (prepared.enforceAccess) {
        return app.serviceViewGetAsClient(serviceName, viewName, prepared.payload, prepared.client)
      }
      return app.serviceViewGet(serviceName, viewName, prepared.payload)
    }
  }
}

export function buildToolMap(app, endpoint, customTools = {}) {
  return { ...generateMcpTools(app, endpoint), ...customTools }
}

export function generateMcpTools(app, endpoint) {
  const tools = {}
  const manifest = manifestOf(endpoint)
  const serviceDefinitions = Object.values(app.startedServices || {}).map(service => service.definition)

  for (const serviceDefinition of serviceDefinitions) {
    const serviceName = serviceDefinition.name

    for (const actionName of Object.keys(serviceDefinition.actions || {})) {
      const actionDef = serviceDefinition.actions[actionName]
      const mcp = actionDef.mcp
      if (!mcp?.expose) continue
      const toolName = mcp.toolName || defaultToolName(serviceName, actionName)
      if (!shouldExposeTool(manifest, serviceName, toolName, actionName)) continue
      if (tools[toolName]) throw new Error('Duplicate MCP tool name: ' + toolName)
      tools[toolName] = createActionTool(app, endpoint, serviceName, actionName, actionDef, mcp)
    }

    for (const viewName of Object.keys(serviceDefinition.views || {})) {
      const viewDef = serviceDefinition.views[viewName]
      if (viewDef.internal) continue
      const mcp = viewDef.mcp
      if (!mcp?.expose) continue
      const toolName = mcp.toolName || defaultToolName(serviceName, viewName)
      if (!shouldExposeTool(manifest, serviceName, toolName, viewName)) continue
      if (tools[toolName]) throw new Error('Duplicate MCP tool name: ' + toolName)
      tools[toolName] = createViewTool(app, endpoint, serviceName, viewName, viewDef, mcp)
    }
  }

  return tools
}

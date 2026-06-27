import { McpSpecification } from '@live-change/framework'

export interface McpConfigSource {
  mcp?: McpSpecification | boolean
  readMcp?: McpSpecification | boolean
  writeMcp?: McpSpecification | boolean
  createMcp?: McpSpecification | boolean
  updateMcp?: McpSpecification | boolean
  deleteMcp?: McpSpecification | boolean
  setMcp?: McpSpecification | boolean
  listMcp?: McpSpecification | boolean
}

export function normalizeMcp(mcp: McpSpecification | boolean | undefined): McpSpecification | undefined {
  if (mcp === undefined || mcp === false) return undefined
  if (mcp === true) return { expose: true }
  return mcp
}

export type McpOperationKind = 'read' | 'write' | 'create' | 'update' | 'delete' | 'set' | 'list'

export function resolveMcpConfig(
  config: McpConfigSource,
  kind: McpOperationKind
): McpSpecification | undefined {
  const specificKey = `${kind}Mcp` as keyof McpConfigSource
  const specific = normalizeMcp(config[specificKey] as McpSpecification | boolean | undefined)
  if (specific !== undefined) return specific

  if (kind === 'list') {
    const read = normalizeMcp(config.readMcp)
    if (read !== undefined) return read
  }

  if (['create', 'update', 'delete', 'set'].includes(kind)) {
    const write = normalizeMcp(config.writeMcp)
    if (write !== undefined) return write
  }

  return normalizeMcp(config.mcp)
}

export function mcpFields(config: McpConfigSource, kind: McpOperationKind) {
  const mcp = resolveMcpConfig(config, kind)
  return mcp ? { mcp } : {}
}

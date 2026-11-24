export function openClient(endpoint) {
  return {
    session: endpoint.session || 'agent-mcp',
    roles: endpoint.roles || ['admin']
  }
}

export function tokenClient(auth) {
  return {
    session: auth.session,
    user: auth.user,
    roles: Array.isArray(auth.roles) ? auth.roles : []
  }
}

export function withMcpUserParam(schema, serviceName, endpoint) {
  if (!endpoint || endpoint.requireToken) return schema
  const scoped = endpoint.userScopedServices || []
  if (!scoped.includes(serviceName)) return schema
  return {
    ...schema,
    properties: {
      user: {
        type: 'string',
        description: 'Owner user id (user_User). The call runs as this user.'
      },
      ...schema.properties
    },
    required: [...(schema.required || []), 'user']
  }
}

export function prepareOpenCall(endpoint, serviceName, args = {}) {
  const payload = { ...args }
  const scoped = endpoint.userScopedServices || []
  if (!scoped.includes(serviceName)) {
    return {
      payload,
      user: null,
      client: openClient(endpoint),
      enforceAccess: false
    }
  }
  const user = payload.user
  if (!user) throw new Error('MCP ' + serviceName + ': "user" is required')
  delete payload.user
  return {
    payload,
    user,
    client: {
      session: 'agent-mcp:' + user,
      user,
      roles: endpoint.roles || ['admin']
    },
    enforceAccess: true
  }
}

export function prepareTokenCall(args = {}, auth) {
  if (!auth?.user) throw new Error('MCP token is required')
  const payload = { ...args }
  if (payload.user && payload.user !== auth.user) {
    throw new Error('MCP user does not match the token')
  }
  delete payload.user
  return {
    payload,
    user: auth.user,
    client: tokenClient(auth),
    enforceAccess: true
  }
}

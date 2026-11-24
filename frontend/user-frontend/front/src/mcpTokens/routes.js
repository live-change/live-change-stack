export function mcpTokensRoutes(config = {}) {
  const { prefix = '/', route = (r) => r } = config
  return [
    route({
      name: 'user:mcpTokens',
      path: prefix + 'mcp-tokens',
      meta: { signedIn: true },
      component: () => import('./McpTokensSettings.vue')
    })
  ]
}

export default mcpTokensRoutes

---
title: Agent MCP service
---

# Agent MCP service

`@live-change/agent-mcp-service` is the shared JSON-RPC server that turns LiveChange actions and views into MCP tools. One process can expose several endpoints. Each endpoint has its own path, tool list, and access mode.

The service name stays `agentMcpServer`. Import it from the package, not from a copied folder:

```js
import agentMcpServer from '@live-change/agent-mcp-service'
```

## Open mode and token mode

Open mode matches the historical bot-server and auto-firma servers. The HTTP endpoint does not check a secret. Tools run with the endpoint's synthetic client (`session` and `roles` from config, usually `agent-mcp` and `admin`). Services listed in `userScopedServices` still require a `user` argument. That argument becomes `client.user`, and the roles stay the endpoint roles.

Token mode is for applications that must use the same access control as a signed-in browser. Creating a token:

1. Generates a random `mcp_` secret. Only its SHA-256 hash is stored.
2. Creates a real `session_Session` through `createSessionKeyIfNotExists`.
3. Signs that session in as the current user through the `user` service `signIn` trigger.

Later MCP calls resolve the secret to that session and user. `client.roles` are the roles stored on `user_User`. Generated `createMyUser*` / `myUser*` actions and access-control checks then behave as they do for that account in the browser. The tool schema does not include a `user` argument. If a caller still sends `user` and it differs from the token owner, the call fails.

## Endpoint config

Put the list on the `agentMcpServer` entry in `app.config.js`.

```js
{
  name: 'agentMcpServer',
  customTools: () => import('./agentMcpServer/customTools.js'),
  endpoints: [
    {
      name: 'open',
      path: '/api/agentMcpServer/rpc',
      ssePath: '/api/agentMcpServer/sse',
      transport: ['http', 'sse'],
      requireToken: false,
      roles: ['admin'],
      session: 'agent-mcp',
      serverName: 'agent-mcp-server',
      snippetName: 'agent-mcp',
      expose: {
        includeServices: ['invoice'],
        includeTools: [],
        excludeTools: []
      },
      userScopedServices: [],
      serializeResult: (name, result) => JSON.stringify(result, null, 2)
    },
    {
      name: 'agent',
      path: '/api/agentMcp/agent/rpc',
      transport: ['http'],
      requireToken: true,
      serverName: 'html5-ads-mcp',
      snippetName: 'html5-ads',
      expose: { includeServices: ['html5Ads'] }
    }
  ]
}
```

| Field | Meaning |
|---|---|
| `name` | Endpoint id. `open` is the default for in-process `handleMcpRequest` calls that omit a name. |
| `path` | HTTP POST path. |
| `ssePath` | Optional SSE path. Defaults to the HTTP path with `/rpc` replaced by `/sse`. |
| `transport` | `http`, `sse`, and `stdio`. Stdio starts only when `AGENT_MCP_TRANSPORT=stdio`. |
| `requireToken` | `true` reads `Authorization: Bearer` and then `?token=`. Missing, unknown, or revoked tokens return HTTP 401. |
| `roles` / `session` | Synthetic client for open mode. |
| `expose` | `includeServices`, `includeTools`, `excludeTools`. Same rules as the old `expose.config.js`. |
| `userScopedServices` | Open-mode services whose tools require `user`. |
| `customTools` | Async loader. Its default export is merged over generated tools. Keep app-specific tools in the app. |
| `serializeResult` | Optional `(toolName, result) => string`. Default is `JSON.stringify`. |
| `afterAction` | Optional hook after a generated action. bot-server uses it to grant project ownership. |
| `serverName` | `initialize` result `serverInfo.name`. |
| `snippetName` | Key used in the settings-page Cursor, Claude Code, and Codex snippets. |

Several endpoints in one app are just several objects in `endpoints`. Each has its own tool cache and auth.

## Tokens

The model is `McpToken`, owned by the signed-in user. It is not exposed as an MCP tool.

- `createMyUserMcpToken` `{ name }` returns `{ id, name, token, tokenPrefix }` once.
- `revokeMyUserMcpToken` `{ mcpToken }` sets `revokedAt`.
- `myUserMcpTokens` lists the owner's rows.

The settings screen is `/user/settings/mcp-tokens` in `@live-change/user-frontend`. It shows the token list, a revoke button, and copyable snippets:

- Cursor `.cursor/mcp.json` with an `Authorization` header
- Claude Code `.mcp.json` with `"type": "http"` and the same header
- Codex `config.toml` with a headers table
- A URL with `?token=` for clients that cannot send headers

The server accepts both the header and the query token. Snippets prefer the header.

`lastUsedAt` is written at most once an hour.

## Exposing tools

On an action or view:

```js
mcp: { expose: true }
```

On a relation (`userItem`, `itemOf`, …): `readMcp: true` and `writeMcp: true`. The relations plugin copies that onto the generated actions and views. Tool names are `serviceName_actionOrViewName`.

Only tools that pass the endpoint `expose` manifest are registered.

## Migrating an application

1. Depend on `@live-change/agent-mcp-service`.
2. Replace the local `agentMcpServer` import in `services.list.js` with the package.
3. Move the old manifest and custom tools into the `endpoints` / `customTools` config above.
4. Delete the local generator, schema, and HTTP endpoint files. Keep `customTools.js` in the app.
5. Run `localUpdate` (or `update --withDb --createDb`) so `McpToken` is created.
6. For token mode, set `requireToken: true` and stop adding `user` to those tool calls.

Open-mode apps can keep passing `user` for the services listed in `userScopedServices`. Their in-process callers can keep using `handleMcpRequest(request)` or `handleMcpRequest(request, { endpointName: 'open' })`.

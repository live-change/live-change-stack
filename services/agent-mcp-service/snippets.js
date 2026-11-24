function serverKey(name) {
  return name || 'agent-mcp'
}

function tomlKey(name) {
  if (/^[A-Za-z0-9_]+$/.test(name)) return name
  return '"' + String(name).replace(/"/g, '') + '"'
}

export function buildSnippets({ origin, path, token, snippetName }) {
  const base = String(origin || '').replace(/\/$/, '') + (path || '')
  const key = serverKey(snippetName)
  const headerUrl = base
  const queryUrl = token
    ? base + (base.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(token)
    : base
  const cursor = token
    ? {
      mcpServers: {
        [key]: {
          url: headerUrl,
          headers: { Authorization: 'Bearer ' + token }
        }
      }
    }
    : {
      mcpServers: {
        [key]: { url: headerUrl }
      }
    }
  const claude = token
    ? {
      mcpServers: {
        [key]: {
          type: 'http',
          url: headerUrl,
          headers: { Authorization: 'Bearer ' + token }
        }
      }
    }
    : {
      mcpServers: {
        [key]: {
          type: 'http',
          url: headerUrl
        }
      }
    }
  const table = 'mcp_servers.' + tomlKey(key)
  const toml = token
    ? '[' + table + ']\nurl = "' + headerUrl + '"\n\n[' + table + '.headers]\nAuthorization = "Bearer ' + token + '"\n'
    : '[' + table + ']\nurl = "' + headerUrl + '"\n'
  return [
    {
      id: 'cursor',
      title: 'Cursor',
      where: 'Project .cursor/mcp.json or ~/.cursor/mcp.json',
      snippet: JSON.stringify(cursor, null, 2)
    },
    {
      id: 'claude',
      title: 'Claude Code',
      where: 'Project .mcp.json',
      snippet: JSON.stringify(claude, null, 2)
    },
    {
      id: 'codex',
      title: 'Codex',
      where: '~/.codex/config.toml',
      snippet: toml
    },
    {
      id: 'url',
      title: 'URL',
      where: token ? 'Address with token' : 'Endpoint address',
      snippet: queryUrl
    }
  ]
}

import { randomBytes } from 'crypto'

import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import { hashToken } from './authenticator.js'

export const McpToken = definition.model({
  name: 'McpToken',
  properties: {
    name: {
      type: String,
      validation: ['nonEmpty']
    },
    tokenHash: {
      type: String,
      validation: ['nonEmpty']
    },
    tokenPrefix: {
      type: String
    },
    session: {
      type: String,
      validation: ['nonEmpty']
    },
    createdAt: {
      type: Date
    },
    lastUsedAt: {
      type: Date
    },
    revokedAt: {
      type: Date
    }
  },
  indexes: {
    byTokenHash: {
      property: ['tokenHash']
    }
  },
  userItem: {
    userReadAccess: () => true,
    readMcp: false,
    writeMcp: false
  }
})

definition.action({
  name: 'createMyUserMcpToken',
  properties: {
    name: {
      type: String,
      validation: ['nonEmpty']
    }
  },
  access: (params, { client }) => !!client?.user,
  waitForEvents: true,
  async execute({ name }, { client, triggerService }, emit) {
    const token = 'mcp_' + randomBytes(32).toString('hex')
    const tokenHash = hashToken(token)
    const id = app.generateUid()
    const sessionKey = app.generateUid() + app.generateUid()
    const created = await triggerService({
      service: 'session',
      type: 'createSessionKeyIfNotExists'
    }, { sessionKey })
    const session = created?.session
    if (!session) throw new Error('session was not created')
    await triggerService({
      service: 'user',
      type: 'signIn'
    }, {
      user: client.user,
      session
    })
    const createdAt = new Date()
    emit({
      type: 'McpTokenCreated',
      mcpToken: id,
      identifiers: { user: client.user },
      data: {
        name,
        tokenHash,
        tokenPrefix: token.slice(0, 12),
        session,
        createdAt
      }
    })
    return {
      id,
      name,
      token,
      tokenPrefix: token.slice(0, 12)
    }
  }
})

definition.action({
  name: 'revokeMyUserMcpToken',
  properties: {
    mcpToken: {
      type: String,
      validation: ['nonEmpty']
    }
  },
  access: (params, { client }) => !!client?.user,
  waitForEvents: true,
  async execute({ mcpToken }, { client }, emit) {
    const row = await McpToken.get(mcpToken)
    if (!row || row.user !== client.user) throw new Error('not_found')
    emit({
      type: 'McpTokenUpdated',
      mcpToken,
      identifiers: { user: client.user },
      data: { revokedAt: new Date() }
    })
    return { id: mcpToken }
  }
})

definition.trigger({
  name: 'touchMcpToken',
  properties: {
    mcpToken: {
      type: String,
      validation: ['nonEmpty']
    }
  },
  async execute({ mcpToken }, context, emit) {
    const row = await McpToken.get(mcpToken)
    if (!row || row.revokedAt) return
    emit({
      type: 'McpTokenUpdated',
      mcpToken,
      identifiers: { user: row.user },
      data: { lastUsedAt: new Date() }
    })
  }
})

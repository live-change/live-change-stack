import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildToolMap, generateMcpTools } from '../generator.js'
import { shouldExposeTool } from '../exposeConfig.js'

function fakeApp() {
  return {
    startedServices: {
      html5Ads: {
        definition: {
          name: 'html5Ads',
          actions: {
            createMyUserAdKind: {
              properties: {
                name: { type: 'String', validation: ['nonEmpty'] }
              },
              mcp: { expose: true }
            },
            privateAction: {
              properties: {},
              mcp: { expose: false }
            }
          },
          views: {
            myUserAdKinds: {
              properties: {},
              mcp: { expose: true }
            },
            internalView: {
              internal: true,
              properties: {},
              mcp: { expose: true }
            }
          }
        }
      },
      seo: {
        definition: {
          name: 'seo',
          actions: {
            createPhrase: {
              properties: {},
              mcp: { expose: true }
            }
          },
          views: {}
        }
      }
    }
  }
}

test('shouldExposeTool filters by service, tool and exclude list', () => {
  const manifest = { includeServices: ['html5Ads'], excludeTools: ['html5Ads_myUserAdKinds'] }
  assert.equal(shouldExposeTool(manifest, 'html5Ads', 'html5Ads_createMyUserAdKind', 'createMyUserAdKind'), true)
  assert.equal(shouldExposeTool(manifest, 'html5Ads', 'html5Ads_myUserAdKinds', 'myUserAdKinds'), false)
  assert.equal(shouldExposeTool(manifest, 'seo', 'seo_createPhrase', 'createPhrase'), false)
  assert.equal(shouldExposeTool({ includeTools: ['seo_createPhrase'] }, 'seo', 'seo_createPhrase', 'createPhrase'), true)
  assert.equal(shouldExposeTool({}, 'html5Ads', 'html5Ads_createMyUserAdKind', 'createMyUserAdKind'), false)
})

test('token endpoint schemas omit user and open scoped schemas require it', () => {
  const app = fakeApp()
  const tokenTools = generateMcpTools(app, {
    name: 'agent',
    requireToken: true,
    expose: { includeServices: ['html5Ads'] },
    userScopedServices: ['html5Ads']
  })
  assert.ok(tokenTools.html5Ads_createMyUserAdKind)
  assert.equal(tokenTools.html5Ads_createMyUserAdKind.inputSchema.properties.user, undefined)
  assert.equal(tokenTools.html5Ads_privateAction, undefined)
  assert.equal(tokenTools.html5Ads_internalView, undefined)
  assert.equal(tokenTools.seo_createPhrase, undefined)

  const openTools = generateMcpTools(app, {
    name: 'open',
    requireToken: false,
    roles: ['admin'],
    expose: { includeServices: ['seo', 'html5Ads'] },
    userScopedServices: ['seo']
  })
  assert.equal(openTools.seo_createPhrase.inputSchema.required.includes('user'), true)
  assert.equal(openTools.html5Ads_createMyUserAdKind.inputSchema.properties.user, undefined)
})

test('buildToolMap lets custom tools replace generated names per endpoint', () => {
  const app = fakeApp()
  const first = buildToolMap(app, {
    name: 'a',
    requireToken: true,
    expose: { includeServices: ['html5Ads'] }
  }, {
    extra: { description: 'custom', inputSchema: { type: 'object', properties: {} }, handler() {} }
  })
  const second = buildToolMap(app, {
    name: 'b',
    requireToken: false,
    roles: ['admin'],
    expose: { includeServices: ['seo'] },
    userScopedServices: ['seo']
  }, {})
  assert.ok(first.html5Ads_myUserAdKinds)
  assert.ok(first.extra)
  assert.equal(second.html5Ads_myUserAdKinds, undefined)
  assert.ok(second.seo_createPhrase)
  assert.equal(second.extra, undefined)
})

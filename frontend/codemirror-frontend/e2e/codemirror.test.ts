import test from 'node:test'
import assert from 'node:assert'
import App from '@live-change/framework'
import { withBrowser } from './withBrowser.js'
import { withTwoPages } from './withTwoPages.js'
import { e2eSuite } from './e2eSuite.js'
import type { Page } from 'playwright'

const DEFAULT_TARGET = { targetType: 'Example', target: 'demo' } as const

function documentId() {
  return App.encodeIdentifier([DEFAULT_TARGET.targetType, DEFAULT_TARGET.target])
}

async function waitForCodeMirrorContent(page: Page, timeoutMs: number) {
  await page.getByText('CodeMirror collab demo').waitFor({ state: 'visible', timeout: 30000 })
  await page.locator('.p-tag').filter({ hasText: /^(loaded|saved)$/ }).first()
    .waitFor({ state: 'visible', timeout: timeoutMs })
  await page.locator('.lc-cm-editor .cm-content').first()
    .waitFor({ state: 'attached', timeout: 30000 })
}

async function editorBody(page: Page) {
  return page.locator('.lc-cm-editor .cm-content').first()
}

async function typeInEditor(page: Page, text: string) {
  await waitForCodeMirrorContent(page, 90000)
  await page.evaluate(() => {
    const el = document.querySelector('.lc-cm-editor .cm-content')
    if (el instanceof HTMLElement) el.focus()
  })
  await page.keyboard.insertText(text)
}

async function typeInEditorWithDelay(page: Page, text: string, delay: number) {
  await waitForCodeMirrorContent(page, 90000)
  await page.evaluate(() => {
    const el = document.querySelector('.lc-cm-editor .cm-content')
    if (el instanceof HTMLElement) el.focus()
  })
  await page.keyboard.type(text, { delay })
}

async function waitForEditorContains(page: Page, substring: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const body = await editorBody(page)
    const t = await body.innerText()
    if (t.includes(substring)) return
    await new Promise((r) => setTimeout(r, 200))
  }
  const body = await editorBody(page)
  const t = await body.innerText()
  assert.ok(t.includes(substring), `editor should contain ${JSON.stringify(substring)}, got ${JSON.stringify(t)}`)
}

e2eSuite('codemirror', () => {
  test('homepage responds and renders html', async () => {
    await withBrowser(async (page, env) => {
      const response = await page.goto(env.url + '/', { waitUntil: 'domcontentloaded' })
      assert.ok(response, 'navigation returned response')
      assert.ok(response!.ok(), 'homepage responds with success status')

      const html = await page.content()
      assert.ok(html.includes('<html'), 'page content contains html tag')
    })
  })

  test('typing syncs to codemirror Document on server', async () => {
    await withBrowser(async (page, env) => {
      await page.goto(env.url + '/', { waitUntil: 'domcontentloaded' })

      const marker = ` E2E_MARKER_${Date.now()}`
      await typeInEditor(page, marker)

      await page.locator('.p-tag').filter({ hasText: 'saved' }).first().waitFor({ state: 'visible', timeout: 30000 })

      const doc = (await env.grabObject('codemirror', 'Document', documentId())) as {
        content: string[]
      }
      const joined = Array.isArray(doc.content) ? doc.content.join('\n') : String(doc.content)
      assert.ok(joined.includes(marker.trim()), `document content should include marker, got ${JSON.stringify(joined)}`)
    })
  })

  test('two browser sessions see each other edits (collab)', async () => {
    await withTwoPages(async (pageA, pageB, env) => {
      const url = env.url + '/'
      await pageA.goto(url, { waitUntil: 'domcontentloaded' })
      await pageB.goto(url, { waitUntil: 'domcontentloaded' })
      await waitForCodeMirrorContent(pageA, 90000)
      await waitForCodeMirrorContent(pageB, 90000)

      const markerA = `COLLAB_A_${Date.now()}`
      await typeInEditor(pageA, markerA)
      await pageA.locator('.p-tag').filter({ hasText: 'saved' }).first().waitFor({ state: 'visible', timeout: 30000 })
      await waitForEditorContains(pageB, markerA, 20000)

      const markerB = `COLLAB_B_${Date.now()}`
      await typeInEditor(pageB, markerB)
      await pageB.locator('.p-tag').filter({ hasText: 'saved' }).first().waitFor({ state: 'visible', timeout: 30000 })
      await waitForEditorContains(pageA, markerB, 20000)

      const doc = (await env.grabObject('codemirror', 'Document', documentId())) as {
        content: string[]
      }
      const joined = Array.isArray(doc.content) ? doc.content.join('\n') : String(doc.content)
      assert.ok(joined.includes(markerA), 'backend document should include A marker')
      assert.ok(joined.includes(markerB), 'backend document should include B marker')
    })
  })

  test('second markdown heading persists to backend Document', async () => {
    await withBrowser(async (page, env) => {
      await page.goto(env.url + '/', { waitUntil: 'domcontentloaded' })

      const heading = `# e2e_second_hdr_${Date.now()}`
      await typeInEditor(page, `\n\n${heading}\n`)

      await page.locator('.p-tag').filter({ hasText: 'saved' }).first().waitFor({ state: 'visible', timeout: 30000 })

      const doc = (await env.grabObject('codemirror', 'Document', documentId())) as {
        content: string[]
      }
      const joined = Array.isArray(doc.content) ? doc.content.join('\n') : String(doc.content)
      assert.ok(
        joined.includes(heading),
        `document should include second heading, got ${JSON.stringify(joined)}`
      )
    })
  })

  test('concurrent first edits from two sessions merge (server rebase path)', async () => {
    await withTwoPages(async (pageA, pageB, env) => {
      const url = env.url + '/'
      await pageA.goto(url, { waitUntil: 'domcontentloaded' })
      await pageB.goto(url, { waitUntil: 'domcontentloaded' })
      await waitForCodeMirrorContent(pageA, 90000)
      await waitForCodeMirrorContent(pageB, 90000)

      const markerA = `REBASE_A_${Date.now()}`
      const markerB = `REBASE_B_${Date.now()}`

      await Promise.all([
        typeInEditor(pageA, markerA),
        typeInEditor(pageB, markerB)
      ])

      await Promise.all([
        pageA.locator('.p-tag').filter({ hasText: 'saved' }).first().waitFor({ state: 'visible', timeout: 30000 }),
        pageB.locator('.p-tag').filter({ hasText: 'saved' }).first().waitFor({ state: 'visible', timeout: 30000 })
      ])

      const doc = (await env.grabObject('codemirror', 'Document', documentId())) as {
        content: string[]
      }
      const joined = Array.isArray(doc.content) ? doc.content.join('\n') : String(doc.content)
      assert.ok(joined.includes(markerA), 'backend document should include A after concurrent pushes')
      assert.ok(joined.includes(markerB), 'backend document should include B after concurrent pushes')
    })
  })

  test('rapid typing does not lose text and does not trigger message out of order', async () => {
    await withBrowser(async (page, env) => {
      const consoleErrors: string[] = []
      const pageErrors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })
      page.on('pageerror', (err) => {
        pageErrors.push(err.message)
      })

      await page.goto(env.url + '/', { waitUntil: 'domcontentloaded' })

      const marker = `RAPID_${Date.now()}_abcdefghijklmnopqrstuvwxyz_0123456789`
      await typeInEditorWithDelay(page, marker, 50)
      await page.locator('.p-tag').filter({ hasText: 'saved' }).first().waitFor({ state: 'visible', timeout: 30000 })

      const doc = (await env.grabObject('codemirror', 'Document', documentId())) as {
        content: string[]
      }
      const joined = Array.isArray(doc.content) ? doc.content.join('\n') : String(doc.content)
      assert.ok(joined.includes(marker), 'backend document should include full rapid marker text')

      const allErrors = [...consoleErrors, ...pageErrors].join('\n')
      assert.ok(!allErrors.includes('message out of order'), `unexpected ordering error in browser logs: ${allErrors}`)
    })
  })
})

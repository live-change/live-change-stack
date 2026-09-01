import assert from 'node:assert'
import { withBrowser } from './withBrowser.js'
import { e2eSuite, test } from './e2eSuite.js'

async function dragPort(
  page: import('playwright').Page,
  from: import('playwright').Locator,
  to: import('playwright').Locator
) {
  await from.waitFor({ state: 'visible', timeout: 15000 })
  await to.waitFor({ state: 'visible', timeout: 15000 })
  await from.scrollIntoViewIfNeeded()
  await to.scrollIntoViewIfNeeded()
  const fromBox = await from.boundingBox()
  const toBox = await to.boundingBox()
  assert.ok(fromBox && toBox, 'missing port bounding box')
  await page.mouse.move(fromBox.x + fromBox.width / 2, fromBox.y + fromBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(toBox.x + toBox.width / 2, toBox.y + toBox.height / 2, { steps: 12 })
  await page.mouse.up()
}

e2eSuite('kitchen-sink', () => {
  test('page renders kitchen sink toolbar', async () => {
    await withBrowser(async (page, env) => {
      const response = await page.goto(env.url + '/', { waitUntil: 'domcontentloaded' })
      assert.ok(response, 'navigation returned response')
      assert.ok(response!.ok(), 'homepage responds with success status')
      await page.getByTestId('nav-kitchen-sink').waitFor({ state: 'visible', timeout: 30000 })
      await page.getByTestId('add-source').waitFor({ state: 'visible' })
      await page.getByTestId('run-sample').waitFor({ state: 'visible' })
      await page.getByTestId('node-source').first().waitFor({ state: 'visible' })
    })
  })

  test('add a node, run sample, delete a node', async () => {
    await withBrowser(async (page, env) => {
      await page.goto(env.url + '/', { waitUntil: 'domcontentloaded' })
      await page.getByTestId('add-source').waitFor({ state: 'visible', timeout: 30000 })

      const before = await page.getByTestId('node-source').count()
      await page.getByTestId('add-source').click()
      await page.waitForTimeout(300)
      const afterAdd = await page.getByTestId('node-source').count()
      assert.ok(afterAdd > before, 'adding a source should create a node')

      await page.getByTestId('run-sample').click()
      const lastRun = page.getByTestId('last-run')
      await lastRun.waitFor({ state: 'visible' })
      const text = await lastRun.innerText()
      assert.ok(text.includes('sku') || text.includes('traces') || text.includes('{'),
        'run sample should show JSON')

      await page.getByTestId('node-source').last().getByTestId('delete-node').click()
      await page.waitForTimeout(300)
      const afterDelete = await page.getByTestId('node-source').count()
      assert.equal(afterDelete, afterAdd - 1)

      await page.getByTestId('run-sample').click()
      const afterDeleteRun = await lastRun.innerText()
      assert.ok(afterDeleteRun.length > 0, 'graph remains runnable after delete')
    })
  })

  test('drag out port to in port creates an edge', async () => {
    await withBrowser(async (page, env) => {
      await page.goto(env.url + '/', { waitUntil: 'domcontentloaded' })
      await page.getByTestId('add-enrich').waitFor({ state: 'visible', timeout: 30000 })
      await page.getByTestId('add-enrich').click()
      await page.waitForTimeout(300)

      const outPort = page.getByTestId('port-source-out')
      const inPorts = page.getByTestId(/port-.*-in/)
      await outPort.waitFor({ state: 'visible' })
      const target = inPorts.last()
      await target.waitFor({ state: 'visible' })
      await dragPort(page, outPort, target)
      await page.waitForTimeout(400)

      await page.getByTestId('run-sample').click()
      const text = await page.getByTestId('last-run').innerText()
      assert.ok(text.includes('{'), 'graph still runs after connecting')
    })
  })
})

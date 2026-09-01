import assert from 'node:assert'
import { withBrowser } from './withBrowser.js'
import { e2eSuite, test } from './e2eSuite.js'
import type { TestEnv } from './env.js'
import { flowTestId } from '../front/src/demo/flowTestId.js'

async function waitUntil(fn: () => Promise<boolean>, timeoutMs = 10000, message = 'waitUntil timeout') {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (await fn()) return
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error(message)
}

function graphIdFor(calculationId: string) {
  return JSON.stringify('calculation_Calculation') + ':' + JSON.stringify(calculationId)
}

async function waitForCalculation(page: import('playwright').Page) {
  await page.getByTestId('add-constant').waitFor({ state: 'visible', timeout: 60000 })
  await page.waitForURL(/\/calc\/.+/, { timeout: 60000 })
  const calculationId = page.url().split('/').pop() as string
  assert.ok(calculationId && calculationId !== 'calc', 'calculation id in url')
  await waitUntil(async () => !(await page.getByTestId('add-constant').isDisabled()), 20000)
  return calculationId
}

async function fillNumber(locator: import('playwright').Locator, value: string) {
  const input = locator.locator('input').first()
  await input.waitFor({ state: 'visible', timeout: 15000 })
  await input.click({ clickCount: 3 })
  await input.fill(value)
  await input.blur()
}

async function dragPort(
  page: import('playwright').Page,
  fromTestId: string,
  toTestId: string
) {
  const from = page.getByTestId(fromTestId)
  const to = page.getByTestId(toTestId)
  await from.waitFor({ state: 'visible', timeout: 15000 })
  await to.waitFor({ state: 'visible', timeout: 15000 })
  await from.scrollIntoViewIfNeeded()
  await to.scrollIntoViewIfNeeded()
  const fromBox = await from.boundingBox()
  const toBox = await to.boundingBox()
  assert.ok(fromBox && toBox, `missing bounding box for ${fromTestId} or ${toTestId}`)
  await page.mouse.move(fromBox.x + fromBox.width / 2, fromBox.y + fromBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(toBox.x + toBox.width / 2, toBox.y + toBox.height / 2, { steps: 12 })
  await page.mouse.up()
}

e2eSuite('calculation', () => {
  test('page creates a Calculation and Graph', async () => {
    await withBrowser(async (page, env: TestEnv) => {
      await page.goto(env.url + '/calc', { waitUntil: 'domcontentloaded' })
      const calculationId = await waitForCalculation(page)
      const graph = await env.grabObject('flow', 'Graph', graphIdFor(calculationId))
      assert.ok(graph, 'Graph row exists for the calculation')
      env.haveAction('calculation', 'runCalculation')
      env.haveView('flow', 'graphOwnedEdges')
    })
  })

  test('add Constant + Add, connect, run shows the sum', async () => {
    await withBrowser(async (page, env: TestEnv) => {
      await page.goto(env.url + '/calc', { waitUntil: 'domcontentloaded' })
      const calculationId = await waitForCalculation(page)
      const gid = graphIdFor(calculationId)

      await page.getByTestId('add-constant').click()
      await waitUntil(async () => {
        const nodes = await env.haveModel('flow', 'Node').sortedIndexRangeGet('byGraph', ['flow_Graph', gid])
        return (nodes || []).length >= 1
      }, 15000, 'expected 1 node after first add-constant')
      await page.getByTestId('add-constant').click()
      await waitUntil(async () => {
        const nodes = await env.haveModel('flow', 'Node').sortedIndexRangeGet('byGraph', ['flow_Graph', gid])
        return (nodes || []).length >= 2
      }, 15000, 'expected 2 nodes after second add-constant')
      await page.getByTestId('add-add').click()
      await waitUntil(async () => {
        const nodes = await env.haveModel('flow', 'Node').sortedIndexRangeGet('byGraph', ['flow_Graph', gid])
        return (nodes || []).length >= 3
      }, 15000, 'expected 3 nodes after add-add')

      const constantNodes = page.getByTestId('node-calculation_Constant')
      await constantNodes.first().waitFor({ state: 'visible', timeout: 15000 })
      await fillNumber(constantNodes.nth(0).getByTestId('constant-value'), '3')
      await fillNumber(constantNodes.nth(1).getByTestId('constant-value'), '4')
      await waitUntil(async () => {
        const rows = await env.haveModel('calculation', 'Constant')
          .sortedIndexRangeGet('byCalculation', [calculationId])
        const values = []
        for (const row of rows || []) {
          const id = (row as { to?: string, id?: string }).to
            || (row as { id?: string }).id as string
          const obj = await env.grabObject('calculation', 'Constant', id) as { value?: number }
          values.push(obj?.value)
        }
        return values.includes(3) && values.includes(4)
      }, 15000, 'constant values 3 and 4 were not saved')

      const constants = await env.haveModel('calculation', 'Constant')
        .sortedIndexRangeGet('byCalculation', [calculationId])
      const addRows = await env.haveModel('calculation', 'Add')
        .sortedIndexRangeGet('byCalculation', [calculationId])
      assert.ok((constants || []).length >= 2)
      assert.ok((addRows || []).length >= 1)

      const flowNodes = await env.haveModel('flow', 'Node')
        .sortedIndexRangeGet('byGraph', ['flow_Graph', gid])
      const nodeObjects = []
      for (const row of flowNodes || []) {
        const id = (row as { to?: string, id?: string }).to
          || (row as { id?: string }).id as string
        nodeObjects.push(await env.grabObject('flow', 'Node', id) as {
          id: string, logicType: string, logic: string
        })
      }
      const constantFlowNodes = nodeObjects.filter(n => n.logicType == 'calculation_Constant')
      const addFlowNode = nodeObjects.find(n => n.logicType == 'calculation_Add')
      assert.ok(addFlowNode)

      for (const constantNode of constantFlowNodes.slice(0, 2)) {
        await dragPort(
          page,
          `port-${flowTestId(constantNode.id)}-out`,
          `port-${flowTestId(addFlowNode!.id)}-in`
        )
        await page.waitForTimeout(400)
      }

      await waitUntil(async () => {
        const edges = await env.haveModel('flow', 'Edge')
          .sortedIndexRangeGet('byGraph', ['flow_Graph', gid])
        return (edges || []).length >= 2
      }, 15000, 'expected 2 edges after connecting constants to add')

      await page.getByTestId('run-calculation').click()
      const results = page.getByTestId('run-results')
      await waitUntil(async () => {
        const text = await results.innerText()
        return text.includes('7')
      }, 15000, 'run results should include 7')

      await page.getByTestId('add-power').click()
      await waitUntil(async () => {
        const powers = await env.haveModel('calculation', 'Power')
          .sortedIndexRangeGet('byCalculation', [calculationId])
        return (powers || []).length >= 1
      })
      const powerNodeRow = (await env.haveModel('flow', 'Node')
        .sortedIndexRangeGet('byGraph', ['flow_Graph', gid]) || [])
      const powerNodes = []
      for (const row of powerNodeRow as { to?: string, id?: string }[]) {
        const id = row.to || row.id as string
        const obj = await env.grabObject('flow', 'Node', id) as {
          id: string, logicType: string
        }
        if (obj.logicType == 'calculation_Power') powerNodes.push(obj)
      }
      assert.ok(powerNodes[0], 'Power node exists')
      const edgesBeforePower = ((await env.haveModel('flow', 'Edge')
        .sortedIndexRangeGet('byGraph', ['flow_Graph', gid])) || []).length
      await dragPort(
        page,
        `port-${flowTestId(addFlowNode!.id)}-out`,
        `port-${flowTestId(powerNodes[0].id)}-in`
      )
      await waitUntil(async () => {
        const edges = await env.haveModel('flow', 'Edge')
          .sortedIndexRangeGet('byGraph', ['flow_Graph', gid])
        return (edges || []).length > edgesBeforePower
      }, 15000, 'expected an edge from add to power')
      await page.getByTestId('run-calculation').click()
      await waitUntil(async () => {
        const text = await results.innerText()
        return text.includes('49')
      }, 15000, 'run results should include 49')
    })
  })

  test('delete edge removes Wire; delete node removes logic and Node', async () => {
    await withBrowser(async (page, env: TestEnv) => {
      await page.goto(env.url + '/calc', { waitUntil: 'domcontentloaded' })
      const calculationId = await waitForCalculation(page)
      const gid = graphIdFor(calculationId)

      await page.getByTestId('add-constant').click()
      await waitUntil(async () => {
        const nodes = await env.haveModel('flow', 'Node').sortedIndexRangeGet('byGraph', ['flow_Graph', gid])
        return (nodes || []).length >= 1
      }, 15000, 'expected 1 node after add-constant')
      await page.getByTestId('add-add').click()
      await waitUntil(async () => {
        const nodes = await env.haveModel('flow', 'Node').sortedIndexRangeGet('byGraph', ['flow_Graph', gid])
        return (nodes || []).length >= 2
      }, 15000, 'expected 2 nodes after add-add')

      const flowNodes = await env.haveModel('flow', 'Node')
        .sortedIndexRangeGet('byGraph', ['flow_Graph', gid])
      const nodeObjects = []
      for (const row of flowNodes || []) {
        const id = (row as { to?: string, id?: string }).to
          || (row as { id?: string }).id as string
        nodeObjects.push(await env.grabObject('flow', 'Node', id) as {
          id: string, logicType: string, logic: string
        })
      }
      const constantNode = nodeObjects.find(n => n.logicType == 'calculation_Constant')
      const addNode = nodeObjects.find(n => n.logicType == 'calculation_Add')
      assert.ok(constantNode && addNode)

      await dragPort(
        page,
        `port-${flowTestId(constantNode.id)}-out`,
        `port-${flowTestId(addNode.id)}-in`
      )
      await waitUntil(async () => {
        const edges = await env.haveModel('flow', 'Edge')
          .sortedIndexRangeGet('byGraph', ['flow_Graph', gid])
        return (edges || []).length >= 1
      }, 15000, 'expected an edge after connecting constant to add')

      const edgesBefore = await env.haveModel('flow', 'Edge')
        .sortedIndexRangeGet('byGraph', ['flow_Graph', gid])
      const edgeRow = edgesBefore[0] as { to?: string, id?: string, connection?: string }
      const edgeId = edgeRow.to || edgeRow.id as string
      const edge = await env.grabObject('flow', 'Edge', edgeId) as { connection: string }
      assert.ok(edge?.connection)

      await page.getByTestId(`delete-edge-${flowTestId(edgeId)}`).click({ force: true })
      await waitUntil(async () => !(await env.grabObject('calculation', 'Wire', edge.connection)))
      await waitUntil(async () => !(await env.grabObject('flow', 'Edge', edgeId)))

      const logicId = constantNode.logic
      await page.getByTestId('node-calculation_Constant').first().getByTestId('delete-node').click()
      await waitUntil(async () => !(await env.grabObject('calculation', 'Constant', logicId)))
      await waitUntil(async () => !(await env.grabObject('flow', 'Node', constantNode.id)))
    })
  })
})

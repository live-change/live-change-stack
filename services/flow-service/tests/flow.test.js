import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import App from '@live-change/framework'
import { startFlowTestServer, trigger } from './helpers.js'

const app = App.app()
let server

before(async () => {
  server = await startFlowTestServer()
  assert.ok(server.url)
})

async function createRecipe() {
  return await trigger(app, 'flowTest', 'flowTest_createTestRecipe', { name: 'r' })
}

async function createOp(recipe) {
  return await trigger(app, 'flowTest', 'flowTest_createTestOp', { testRecipe: recipe, label: 'op' })
}

async function setGraph(owner) {
  return await trigger(app, 'flow', 'flow_setGraph', {
    ownerType: 'flowTest_TestRecipe',
    owner
  })
}

async function setNode(graph, logic, position = { x: 10, y: 20 }) {
  return await trigger(app, 'flow', 'flow_setNode', {
    graphType: 'flow_Graph',
    graph,
    logicType: 'flowTest_TestOp',
    logic,
    position
  })
}

async function createWire(source, destination) {
  return await trigger(app, 'flowTest', 'flowTest_createTestWire', {
    sourceType: 'flowTest_TestOp',
    source,
    destinationType: 'flowTest_TestOp',
    destination,
    sourcePort: 'out',
    destinationPort: 'in'
  })
}

async function createEdge({ graph, sourceNode, destNode, connection, sourcePort = 'out', destinationPort = 'in' }) {
  return await trigger(app, 'flow', 'flow_createEdge', {
    graphType: 'flow_Graph',
    graph,
    sourceType: 'flow_Node',
    source: sourceNode,
    destinationType: 'flow_Node',
    destination: destNode,
    connectionType: 'flowTest_TestWire',
    connection,
    sourcePort,
    destinationPort
  })
}

async function waitUntil(fn, timeoutMs = 5000) {
  const start = Date.now()
  while(Date.now() - start < timeoutMs) {
    if(await fn()) return
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  throw new Error('waitUntil timeout')
}

function flowService() {
  return server.apiServer.services.services.find(s => s.name == 'flow')
}

test('generated combination list views exist', () => {
  const views = flowService().views
  assert.ok(views.graphOwnedNodes)
  assert.ok(views.logicOwnedNodes)
  assert.ok(views.graphOwnedEdges)
  assert.ok(views.sourceOwnedEdges)
  assert.ok(views.destinationOwnedEdges)
  assert.ok(views.connectionOwnedEdges)
})

test('set Graph for an owner and Graph id is the Any composite of owner type and id', async () => {
  const recipe = await createRecipe()
  const graphId = await setGraph(recipe)
  const graph = await flowService().models.Graph.get(graphId)
  assert.ok(graph)
  assert.equal(graph.ownerType, 'flowTest_TestRecipe')
  assert.equal(graph.owner, recipe)
  const expectedId = JSON.stringify('flowTest_TestRecipe') + ':' + JSON.stringify(recipe)
  assert.equal(graphId, expectedId)
  assert.notEqual(graphId, recipe)
})

test('set Node; graphOwnedNodes returns it; delete TestOp deletes Node', async () => {
  const recipe = await createRecipe()
  const graphId = await setGraph(recipe)
  const op = await createOp(recipe)
  const nodeId = await setNode(graphId, op)
  const node = await flowService().models.Node.get(nodeId)
  assert.ok(node)
  assert.equal(node.logic, op)
  assert.equal(node.graph, graphId)
  assert.match(nodeId, /^h_[A-Za-z0-9_-]{22}$/)
  const compositeId = [
    JSON.stringify('flow_Graph'),
    JSON.stringify(graphId),
    JSON.stringify('flowTest_TestOp'),
    JSON.stringify(op)
  ].join(':')
  assert.notEqual(nodeId, compositeId)

  const listed = await flowService().models.Node.sortedIndexRangeGet('byGraph', ['flow_Graph', graphId])
  assert.ok(listed.some(row => (row.to || row.id) == nodeId))

  await trigger(app, 'flowTest', 'flowTest_deleteTestOp', { testOp: op })
  await waitUntil(async () => !(await flowService().models.Node.get(nodeId)))
})

test('create Edge; delete Node deletes Edge; delete Wire deletes Edge', async () => {
  const recipe = await createRecipe()
  const graphId = await setGraph(recipe)
  const opA = await createOp(recipe)
  const opB = await createOp(recipe)
  const nodeA = await setNode(graphId, opA, { x: 0, y: 0 })
  const nodeB = await setNode(graphId, opB, { x: 100, y: 0 })
  const wire = await createWire(opA, opB)
  const edge = await createEdge({
    graph: graphId,
    sourceNode: nodeA,
    destNode: nodeB,
    connection: wire
  })
  const stored = await flowService().models.Edge.get(edge)
  assert.ok(stored)
  assert.equal(stored.connection, wire)

  await trigger(app, 'flow', 'flow_resetNode', {
    graphType: 'flow_Graph',
    graph: graphId,
    logicType: 'flowTest_TestOp',
    logic: opA
  })
  await waitUntil(async () => !(await flowService().models.Edge.get(edge)))

  const wire2 = await createWire(opA, opB)
  const nodeA2 = await setNode(graphId, opA, { x: 0, y: 0 })
  const edge2 = await createEdge({
    graph: graphId,
    sourceNode: nodeA2,
    destNode: nodeB,
    connection: wire2
  })
  await trigger(app, 'flowTest', 'flowTest_deleteTestWire', { testWire: wire2 })
  await waitUntil(async () => !(await flowService().models.Edge.get(edge2)))
})

test('second Edge for the same connection is rejected', async () => {
  const recipe = await createRecipe()
  const graphId = await setGraph(recipe)
  const opA = await createOp(recipe)
  const opB = await createOp(recipe)
  const nodeA = await setNode(graphId, opA, { x: 0, y: 0 })
  const nodeB = await setNode(graphId, opB, { x: 100, y: 0 })
  const wire = await createWire(opA, opB)
  await createEdge({
    graph: graphId,
    sourceNode: nodeA,
    destNode: nodeB,
    connection: wire
  })
  await assert.rejects(
    () => createEdge({
      graph: graphId,
      sourceNode: nodeA,
      destNode: nodeB,
      connection: wire
    }),
    /edge_exists/
  )
})

test('deleteObject for an unrelated type does not delete Nodes', async () => {
  const recipe = await createRecipe()
  const graphId = await setGraph(recipe)
  const op = await createOp(recipe)
  const nodeId = await setNode(graphId, op)
  const unrelated = await trigger(app, 'flowTest', 'flowTest_createUnrelated', { name: 'x' })
  await trigger(app, 'flowTest', 'flowTest_deleteUnrelated', { unrelated })
  const node = await flowService().models.Node.get(nodeId)
  assert.ok(node)
})

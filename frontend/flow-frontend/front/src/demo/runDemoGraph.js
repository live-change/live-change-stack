function portKind(portId) {
  if (typeof portId != 'string') return null
  if (portId === 'in' || portId.endsWith('/in')) return 'in'
  if (portId === 'out' || portId.endsWith('/out')) return 'out'
  return null
}

function normalizeLink(edge) {
  const srcKind = portKind(edge.src?.port)
  const destKind = portKind(edge.dest?.port)
  if (srcKind === 'out' && destKind === 'in') {
    return { from: edge.src.node, to: edge.dest.node }
  }
  if (srcKind === 'in' && destKind === 'out') {
    return { from: edge.dest.node, to: edge.src.node }
  }
  return null
}

function executeNode(node, inputRecords) {
  if (node.type === 'source') {
    return { ...(node.record || {}) }
  }
  const base = Object.assign({}, ...inputRecords)
  if (node.type === 'enrich') {
    const field = node.field || 'field'
    return { ...base, [field]: node.value }
  }
  return base
}

export function runDemoGraph(nodes, edges) {
  const nodeById = new Map(nodes.map(node => [node.id, node]))
  const incoming = new Map(nodes.map(node => [node.id, []]))
  const outgoing = new Map(nodes.map(node => [node.id, []]))

  for (const edge of edges) {
    const link = normalizeLink(edge)
    if (!link) continue
    if (!nodeById.has(link.from) || !nodeById.has(link.to)) continue
    incoming.get(link.to).push(link.from)
    outgoing.get(link.from).push(link.to)
  }

  const indegree = new Map(nodes.map(node => [node.id, incoming.get(node.id).length]))
  const queue = nodes.filter(node => indegree.get(node.id) === 0).map(node => node.id)
  const order = []
  while (queue.length) {
    const id = queue.shift()
    order.push(id)
    for (const nextId of outgoing.get(id)) {
      indegree.set(nextId, indegree.get(nextId) - 1)
      if (indegree.get(nextId) === 0) queue.push(nextId)
    }
  }

  if (order.length !== nodes.length) {
    return { error: 'Cycle in the graph', traces: [], outputs: [] }
  }

  const values = new Map()
  const traces = []
  for (const id of order) {
    const node = nodeById.get(id)
    const inputRecords = incoming.get(id).map(fromId => values.get(fromId)).filter(Boolean)
    const record = executeNode(node, inputRecords)
    values.set(id, record)
    traces.push({ nodeId: id, type: node.type, record })
  }

  const outputs = nodes
    .filter(node => node.type === 'output')
    .map(node => ({ id: node.id, record: values.get(node.id) }))

  return { traces, outputs }
}

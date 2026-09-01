function rowId(row) {
  return row?.to || row?.id
}

export function runCalculationGraph({
  constants = [],
  adds = [],
  multiplies = [],
  powers = [],
  wires = []
} = {}) {
  const nodes = new Map()
  for(const constant of constants) {
    nodes.set(rowId(constant), {
      kind: 'constant',
      value: Number(constant.value ?? 1)
    })
  }
  for(const add of adds) {
    nodes.set(rowId(add), { kind: 'add' })
  }
  for(const multiply of multiplies) {
    nodes.set(rowId(multiply), { kind: 'multiply' })
  }
  for(const power of powers) {
    nodes.set(rowId(power), {
      kind: 'power',
      exponent: Number(power.exponent ?? 2)
    })
  }

  const incoming = new Map()
  const outgoing = new Map()
  for(const id of nodes.keys()) {
    incoming.set(id, [])
    outgoing.set(id, [])
  }
  for(const wire of wires) {
    const source = wire.source
    const destination = wire.destination
    if(!nodes.has(source) || !nodes.has(destination)) continue
    if((wire.destinationPort || 'in') != 'in') continue
    incoming.get(destination).push(source)
    outgoing.get(source).push(destination)
  }

  const indegree = new Map()
  for(const [id, sources] of incoming) {
    indegree.set(id, sources.length)
  }
  const queue = [...nodes.keys()].filter(id => indegree.get(id) == 0)
  const order = []
  while(queue.length) {
    const id = queue.shift()
    order.push(id)
    for(const next of outgoing.get(id)) {
      indegree.set(next, indegree.get(next) - 1)
      if(indegree.get(next) == 0) queue.push(next)
    }
  }

  if(order.length != nodes.size) {
    return { values: {}, error: 'Cycle in the graph' }
  }

  const values = {}
  for(const id of order) {
    const node = nodes.get(id)
    const inputs = incoming.get(id).map(sourceId => values[sourceId])
    if(node.kind == 'constant') {
      values[id] = node.value
    } else if(node.kind == 'add') {
      values[id] = inputs.reduce((sum, value) => sum + value, 0)
    } else if(node.kind == 'multiply') {
      values[id] = inputs.length ? inputs.reduce((product, value) => product * value, 1) : 1
    } else if(node.kind == 'power') {
      if(!inputs.length) {
        return { values, error: 'Power is missing an input' }
      }
      values[id] = inputs[0] ** node.exponent
    }
  }

  return { values }
}

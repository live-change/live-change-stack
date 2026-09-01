import definition from './definition.js'
import config from './config.js'
import { Calculation } from './calculation.js'
import { runCalculationGraph } from './runGraph.js'

function rowId(row) {
  return row?.to || row?.id
}

async function loadOwned(model, calculation) {
  const rows = await model.sortedIndexRangeGet('byCalculation', [calculation])
  const objects = []
  for(const row of rows || []) {
    const id = rowId(row)
    const object = await model.get(id)
    objects.push(object || row)
  }
  return objects
}

function opTypeName(kind) {
  return {
    constant: 'calculation_Constant',
    add: 'calculation_Add',
    multiply: 'calculation_Multiply',
    power: 'calculation_Power'
  }[kind]
}

definition.action({
  name: 'runCalculation',
  properties: {
    calculation: {
      type: Calculation,
      validation: ['nonEmpty']
    }
  },
  access: config.readAccess,
  async execute({ calculation }, { service }) {
    const constants = await loadOwned(service.models.Constant, calculation)
    const adds = await loadOwned(service.models.Add, calculation)
    const multiplies = await loadOwned(service.models.Multiply, calculation)
    const powers = await loadOwned(service.models.Power, calculation)

    const ops = [
      ...constants.map(row => ({ type: opTypeName('constant'), id: row.id })),
      ...adds.map(row => ({ type: opTypeName('add'), id: row.id })),
      ...multiplies.map(row => ({ type: opTypeName('multiply'), id: row.id })),
      ...powers.map(row => ({ type: opTypeName('power'), id: row.id }))
    ]

    const seen = new Set()
    const wires = []
    for(const op of ops) {
      const rows = await service.models.Wire.sortedIndexRangeGet('bySource', [op.type, op.id])
      for(const row of rows || []) {
        const id = rowId(row)
        if(seen.has(id)) continue
        seen.add(id)
        const wire = (await service.models.Wire.get(id)) || row
        wires.push(wire)
      }
    }

    return runCalculationGraph({ constants, adds, multiplies, powers, wires })
  }
})

export { runCalculationGraph }

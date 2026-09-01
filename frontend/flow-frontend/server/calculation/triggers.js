import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'

function payloadFromTrigger(trig) {
  const body = trig?.data && typeof trig.data == 'object' ? trig.data : trig
  return {
    identifiers: body.identifiers || body,
    data: body.data,
    object: body.object,
    changeType: body.changeType
  }
}

function wireQueueKey(trig) {
  const { identifiers, data } = payloadFromTrigger(trig)
  return JSON.stringify([
    identifiers.sourceType,
    identifiers.source,
    identifiers.destinationType,
    identifiers.destination,
    data?.sourcePort,
    data?.destinationPort
  ])
}

definition.trigger({
  name: 'createCalculation_Calculation',
  properties: {
    object: { type: String },
    identifiers: { type: Object },
    data: { type: Object },
    changeType: { type: String }
  },
  async execute({ object }, { triggerService }) {
    await triggerService({
      service: 'flow',
      type: 'flow_setGraph'
    }, {
      ownerType: 'calculation_Calculation',
      owner: object
    })
  }
})

definition.trigger({
  name: 'changeCalculation_Wire',
  properties: {
    object: { type: String },
    identifiers: { type: Object },
    data: { type: Object },
    oldData: { type: Object },
    changeType: { type: String }
  },
  queuedBy: wireQueueKey,
  async execute({ object, identifiers, data, changeType }, { service }) {
    if(changeType == 'delete' || !data) return
    if(!identifiers?.sourceType || !identifiers?.destinationType) {
      throw app.logicError('invalid_wire')
    }
    if(data.sourcePort != 'out' || data.destinationPort != 'in') {
      throw app.logicError('invalid_wire_ports')
    }

    const samePair = await service.models.Wire.sortedIndexRangeGet('bySourceAndDestination', [
      identifiers.sourceType,
      identifiers.source,
      identifiers.destinationType,
      identifiers.destination
    ])
    const duplicates = (samePair || []).filter(row => {
      const id = row.to || row.id
      if(id == object) return false
      return row.sourcePort == data.sourcePort && row.destinationPort == data.destinationPort
    })
    if(duplicates.length) throw app.logicError('wire_exists')

    if(identifiers.destinationType == 'calculation_Constant' && data.destinationPort == 'in') {
      throw app.logicError('constant_has_input')
    }

    if(identifiers.destinationType == 'calculation_Power' && data.destinationPort == 'in') {
      const existing = await service.models.Wire.sortedIndexRangeGet('byDestination', [
        identifiers.destinationType,
        identifiers.destination
      ])
      const inbound = (existing || []).filter(row => {
        const id = row.to || row.id
        return id != object && (row.destinationPort || 'in') == 'in'
      })
      if(inbound.length) throw app.logicError('power_single_input')
    }
  }
})

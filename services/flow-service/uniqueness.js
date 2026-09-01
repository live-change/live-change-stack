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

function edgeQueueKey(trig) {
  const { identifiers } = payloadFromTrigger(trig)
  return JSON.stringify([identifiers.connectionType, identifiers.connection])
}

async function loadTableObject(objectType, object) {
  if(!objectType || !object) return null
  return await app.dao.get(['database', 'tableObject', app.databaseName, objectType, object])
}

definition.trigger({
  name: 'changeFlow_Edge',
  properties: {
    object: { type: String },
    identifiers: { type: Object },
    data: { type: Object },
    oldData: { type: Object },
    changeType: { type: String }
  },
  queuedBy: edgeQueueKey,
  async execute({ object, identifiers, data, changeType }, { service }, emit) {
    if(changeType == 'delete' || !data) return
    if(!identifiers?.connectionType || !identifiers?.connection) {
      throw app.logicError('invalid_edge_connection')
    }
    if(identifiers.sourceType != 'flow_Node' || identifiers.destinationType != 'flow_Node') {
      throw app.logicError('invalid_edge_node')
    }

    const existing = await service.models.Edge.sortedIndexRangeGet('byConnection', [
      identifiers.connectionType,
      identifiers.connection
    ])
    const others = (existing || []).filter(row => row.to != object && row.id != object)
    if(others.length) throw app.logicError('edge_exists')

    const connection = await loadTableObject(identifiers.connectionType, identifiers.connection)
    if(!connection) throw app.logicError('connection_not_found')

    const expectedSourcePort = connection.sourcePort
    const expectedDestPort = connection.destinationPort
    if(expectedSourcePort != null && data.sourcePort != expectedSourcePort) {
      throw app.logicError('edge_port_mismatch')
    }
    if(expectedDestPort != null && data.destinationPort != expectedDestPort) {
      throw app.logicError('edge_port_mismatch')
    }
  }
})
